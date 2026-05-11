import { stripe } from "@/lib/stripe"
import { db } from "@/db"
import Stripe from "stripe"

export async function POST(req: Request) {
  try {
    console.log("🔔 Stripe webhook received")

    // Get raw body
    const body = await req.text()

    // Get Stripe signature
    const signature = req.headers.get("stripe-signature")

    if (!signature) {
      console.error("❌ Missing stripe signature")

      return new Response("Missing stripe signature", {
        status: 400,
      })
    }

    // Verify webhook event
    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      )

      console.log("✅ Webhook verified:", event.type)
    } catch (err) {
      console.error("❌ Webhook verification failed:", err)

      return new Response("Invalid webhook signature", {
        status: 400,
      })
    }

    // Respond to Stripe immediately
    // Prevents timeout issues on low-memory VPS
    queueMicrotask(async () => {
      try {
        switch (event.type) {
          case "checkout.session.completed": {
            console.log("💳 Processing checkout.session.completed")

            const session = event.data.object as Stripe.Checkout.Session

            const userId = session.metadata?.userId

            console.log("👤 User ID:", userId)

            if (!userId) {
              console.error("❌ Missing userId in metadata")
              return
            }

            await db.user.update({
              where: {
                id: userId,
              },
              data: {
                plan: "PRO",
              },
            })

            console.log("✅ User upgraded to PRO:", userId)

            break
          }

          default:
            console.log(`ℹ️ Unhandled event type: ${event.type}`)
        }
      } catch (err) {
        console.error("❌ Async webhook processing failed:", err)
      }
    })

    return new Response("Webhook received", {
      status: 200,
    })
  } catch (err) {
    console.error("❌ Webhook route failed:", err)

    return new Response("Webhook Error", {
      status: 500,
    })
  }
}