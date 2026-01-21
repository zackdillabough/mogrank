import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"

// Link Ramp order ID to our order
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const body = await request.json()
    const { orderId, rampOrderId } = body

    if (!orderId || !rampOrderId) {
      return NextResponse.json(
        { error: "Missing orderId or rampOrderId" },
        { status: 400 }
      )
    }

    const { error } = await supabase
      .from("orders")
      .update({ ramp_order_id: rampOrderId })
      .eq("id", orderId)

    if (error) {
      console.error("Error linking Ramp order:", error)
      return NextResponse.json(
        { error: "Failed to link Ramp order" },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Link Ramp error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
