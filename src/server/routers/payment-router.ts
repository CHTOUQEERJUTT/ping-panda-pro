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

  
  
})