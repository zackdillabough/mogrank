import Stripe from "stripe"

export const isTestMode = process.env.STRIPE_MODE === "test"

const stripeKey = isTestMode
  ? process.env.STRIPE_TEST_SECRET_KEY
  : process.env.STRIPE_SECRET_KEY

export const stripe = new Stripe(stripeKey || "sk_placeholder")

export const stripeWebhookSecret = (isTestMode
  ? process.env.STRIPE_TEST_WEBHOOK_SECRET
  : process.env.STRIPE_WEBHOOK_SECRET) || ""
