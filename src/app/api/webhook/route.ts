import { stripe } from "@/lib/stripe"
import { db } from "@/db"
import Stripe from "stripe"

export async function POST(req: Request) {
  try {
    const event = await req.json()

    if (event.type === "checkout.session.completed") {
      const session = event.data.object

      const userId = session.metadata?.userId

      if (!userId) {
        return new Response("Missing userId", { status: 400 })
      }

      // IMPORTANT: update DB safely
      await db.user.update({
        where: { id: userId },
        data: {
          plan: "PRO",
        },
      })
    }

    return new Response("ok", { status: 200 })
  } catch (err) {
    console.error("Webhook error:", err)
    return new Response("Internal error", { status: 500 })
  }
}