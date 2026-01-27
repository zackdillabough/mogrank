import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { stripe } from "@/lib/stripe"
import type Stripe from "stripe"

// List promotion codes
export async function GET() {
  try {
    const session = await auth()
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const promotionCodes = await stripe.promotionCodes.list({
      limit: 100,
      expand: ["data.promotion.coupon"],
    })

    const codes = promotionCodes.data.map((pc) => {
      const coupon = pc.promotion.coupon as Stripe.Coupon | null
      return {
        id: pc.id,
        code: pc.code,
        coupon_id: coupon?.id || "",
        type: coupon?.percent_off ? "percent" : "fixed",
        amount: coupon?.percent_off || (coupon?.amount_off ? coupon.amount_off / 100 : 0),
        times_redeemed: pc.times_redeemed,
        max_redemptions: pc.max_redemptions,
        active: pc.active,
        expires_at: pc.expires_at ? new Date(pc.expires_at * 1000).toISOString() : null,
        created: new Date(pc.created * 1000).toISOString(),
      }
    })

    return NextResponse.json({ codes })
  } catch (error) {
    console.error("Error fetching promotion codes:", error)
    return NextResponse.json(
      { error: "Failed to fetch promotion codes" },
      { status: 500 }
    )
  }
}

// Create a new discount code
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { code, type, amount, maxRedemptions, expiresAt } = body

    if (!type || !amount) {
      return NextResponse.json(
        { error: "Type and amount are required" },
        { status: 400 }
      )
    }

    // Create coupon
    const coupon = await stripe.coupons.create(
      type === "percent"
        ? { percent_off: Number(amount), duration: "forever" }
        : { amount_off: Math.round(Number(amount) * 100), currency: "usd", duration: "forever" }
    )

    // Create promotion code
    const promoParams: Stripe.PromotionCodeCreateParams = {
      promotion: { type: "coupon", coupon: coupon.id },
      ...(code && { code: code.toUpperCase() }),
      ...(maxRedemptions && { max_redemptions: Number(maxRedemptions) }),
      ...(expiresAt && { expires_at: Math.floor(new Date(expiresAt).getTime() / 1000) }),
    }

    const promotionCode = await stripe.promotionCodes.create(promoParams)

    return NextResponse.json({
      id: promotionCode.id,
      code: promotionCode.code,
    })
  } catch (error) {
    console.error("Error creating discount:", error)
    return NextResponse.json(
      { error: "Failed to create discount code" },
      { status: 500 }
    )
  }
}

// Deactivate a promotion code
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "ID is required" }, { status: 400 })
    }

    await stripe.promotionCodes.update(id, { active: false })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Error deactivating promotion code:", error)
    return NextResponse.json(
      { error: "Failed to deactivate promotion code" },
      { status: 500 }
    )
  }
}
