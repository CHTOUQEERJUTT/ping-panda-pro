import { DashboardPage } from "@/components/dashboard-page"
import { db } from "@/db"
import { currentUser } from "@clerk/nextjs/server"
import { redirect } from "next/navigation"
import { DashboardPageContent } from "./dashboard-page-content"
import { CreateEventCategoryModal } from "@/components/create-event-category-modal"
import { Button } from "@/components/ui/button"
import { PlusIcon } from "lucide-react"
import { createCheckoutSession } from "@/lib/stripe"
import { PaymentSuccessModal } from "@/components/ui/payment-success-modal"
import { FREE_QUOTA, PRO_QUOTA } from "@/config"

interface PageProps {
  searchParams: {
    [key: string]: string | string[] | undefined
  }
}

const Page = async ({ searchParams }: PageProps) => {
  const auth = await currentUser()

  if (!auth) redirect("/sign-in")

  let user = await db.user.findUnique({
    where: { externalId: auth.id },
  })

  if (!user) {
    user = await db.user.create({
      data: {
        quotaLimit: 100,
        externalId: auth.id,
        email: auth.emailAddresses[0].emailAddress,
      },
    })
  }

  // 1. Calculate limits
  const categoryCount = await db.eventCategory.count({
    where: { userId: user.id },
  })

  const plan = user.plan
  const limit = plan === "PRO" ? PRO_QUOTA.maxEventCategories : FREE_QUOTA.maxEventCategories
  const isAtCategoryLimit = categoryCount >= limit

  const intent = searchParams.intent
  if (intent === "upgrade") {
    const session = await createCheckoutSession({
      userEmail: user.email,
      userId: user.id,
    })
    if (session.url) redirect(session.url)
  }

  const success = searchParams.success

  return (
    <>
      {success ? <PaymentSuccessModal /> : null}

      <DashboardPage
        cta={
          <CreateEventCategoryModal isAtCategoryLimit={isAtCategoryLimit}>
            <Button disabled={isAtCategoryLimit} className="w-full sm:w-fit">
              <PlusIcon className="size-4 mr-2" />
              {isAtCategoryLimit ? "Limit Reached" : "Add Category"}
            </Button>
          </CreateEventCategoryModal>
        }
        title="Dashboard"
      >
        <DashboardPageContent />
      </DashboardPage>
    </>
  )
}

export default Page