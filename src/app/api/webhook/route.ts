import { stripe } from "@/lib/stripe"
import { db } from "@/db"
import Stripe from "stripe"

export async function POST(req: Request) {
  try {
    const body = await req.text()
    const signature = req.headers.get("stripe-signature")

    if (!signature) {
      return new Response("Missing signature", { status: 400 })
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(
        body,
        signature,
        process.env.STRIPE_WEBHOOK_SECRET!
      )
    } catch (err) {
      console.error("❌ Signature error:", err)
      return new Response("Invalid signature", { status: 400 })
    }

    // ONLY handle success case
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session
      const userId = session.metadata?.userId

      if (!userId) {
        console.error("❌ Missing userId in metadata")
        return new Response("Missing metadata", { status: 400 })
      }

      // DO NOT await inside request lifecycle
      setImmediate(async () => {
        try {
          await db.user.update({
            where: { id: userId },
            data: { plan: "PRO" },
          })

          console.log("✅ User upgraded:", userId)
        } catch (err) {
          console.error("DB update failed:", err)
        }
      })
    }

    // ALWAYS respond immediately
    return new Response("OK", { status: 200 })
  } catch (err) {
    console.error("Webhook crash:", err)
    return new Response("Server error", { status: 500 })
  }
}