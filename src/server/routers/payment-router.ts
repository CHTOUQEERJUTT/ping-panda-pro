import { createCheckoutSession, stripe } from "@/lib/stripe"
import { router } from "../__internals/router"
import { privateProcedure, publicProcedure } from "../procedures"
import { db } from "@/db"
import { HTTPException } from "hono/http-exception"
import Stripe from "stripe"

export const paymentRouter = router({
  // Procedure to start the upgrade process
  createCheckoutSession: privateProcedure.mutation(async ({ c, ctx }) => {
    const { user } = ctx

    const session = await createCheckoutSession({
      userEmail: user.email,
      userId: user.id,
    })

    return c.json({ url: session.url })
  }),

  // Procedure to check the current plan on the frontend
  getUserPlan: privateProcedure.query(async ({ c, ctx }) => {
    const { user } = ctx
    return c.json({ plan: user.plan })
  }),

  // THE WEBHOOK HANDLER
  // This must be a publicProcedure so Stripe can send events to it
  stripeWebhook: publicProcedure.mutation(async ({ c }) => {
    const body = await c.req.text()
    const signature = c.req.header("stripe-signature")

    if (!signature) {
      throw new HTTPException(400, { message: "Missing stripe-signature" })
    }

    try {
      const event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET ?? ""
      )

      if (event.type === "checkout.session.completed") {
        const session = event.data.object as Stripe.Checkout.Session
        const userId = session.metadata?.userId

        if (!userId) {
          throw new HTTPException(400, { message: "Missing userId in metadata" })
        }

        // Update the user to PRO in your Neon database
        await db.user.update({
          where: { id: userId },
          data: { plan: "PRO" },
        })
      }

      return c.json({ success: true })
    } catch (err) {
      console.error("Webhook Error:", err)
      throw new HTTPException(400, { message: "Invalid webhook signature" })
    }
  }),
})