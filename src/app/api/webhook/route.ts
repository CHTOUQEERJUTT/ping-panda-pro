import { stripe } from "@/lib/stripe"
import { db } from "@/db"
import Stripe from "stripe"

export async function POST(req: Request) {
  const body = await req.text()

  const signature = req.headers.get("stripe-signature")

  if (!signature) {
    return new Response("Missing stripe signature", {
      status: 400,
    })
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err) {
    console.error("Webhook verification failed:", err)

    return new Response("Invalid signature", {
      status: 400,
    })
  }

  try {
    switch (event.type) {
      case "checkout.session.completed": {
        const session = event.data.object as Stripe.Checkout.Session

        const userId = session.metadata?.userId

        if (!userId) {
          return new Response("Missing userId", {
            status: 400,
          })
        }

        await db.user.update({
          where: {
            id: userId,
          },
          data: {
            plan: "PRO",
          },
        })

        break
      }
    }

    return new Response("OK", {
      status: 200,
    })
  } catch (err) {
    console.error(err)

    return new Response("Webhook handler failed", {
      status: 500,
    })
  }
}