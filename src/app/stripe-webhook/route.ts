import { stripe } from "@/lib/stripe"
import { db } from "@/db"
import { headers } from "next/headers"
import Stripe from "stripe"

export async function POST(req: Request) {
  const body = await req.text()
  const signature = (await headers()).get("stripe-signature") as string

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    return new Response("Webhook Error", { status: 400 })
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session
    const userId = session.metadata?.userId

    if (userId) {
      await db.user.update({
        where: { id: userId },
        data: { plan: "PRO" },
      })
    }
  }

  return new Response("ok", { status: 200 })
}
