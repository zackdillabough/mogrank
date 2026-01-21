import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { auth } from "@/lib/auth"

// Create a new order
export async function POST(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const session = await auth()
    const body = await request.json()
    const { packageId } = body

    // Get package details
    const { data: pkg, error: pkgError } = await supabase
      .from("packages")
      .select("*")
      .eq("id", packageId)
      .single()

    if (pkgError || !pkg) {
      return NextResponse.json({ error: "Package not found" }, { status: 404 })
    }

    // Create order
    const { data: order, error: orderError } = await supabase
      .from("orders")
      .insert({
        discord_id: session?.user?.discordId || null,
        discord_username: session?.user?.discordUsername || null,
        discord_avatar: session?.user?.discordAvatar || null,
        package_id: packageId,
        package_name: pkg.name,
        amount: pkg.price,
        status: "pending_payment",
        wallet_address: process.env.WALLET_ADDRESS,
      })
      .select()
      .single()

    if (orderError) {
      console.error("Error creating order:", orderError)
      return NextResponse.json(
        { error: "Failed to create order" },
        { status: 500 }
      )
    }

    return NextResponse.json({ order, walletAddress: process.env.WALLET_ADDRESS })
  } catch (error) {
    console.error("Order creation error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

// Get orders (for dashboard)
export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const session = await auth()

    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const all = searchParams.get("all") === "true"

    let query = supabase
      .from("orders")
      .select("*")
      .order("created_at", { ascending: false })

    // If not admin or not requesting all, filter by user
    if (!session.user.isAdmin || !all) {
      query = query.eq("discord_id", session.user.discordId)
    }

    const { data: orders, error } = await query

    if (error) {
      console.error("Error fetching orders:", error)
      return NextResponse.json(
        { error: "Failed to fetch orders" },
        { status: 500 }
      )
    }

    return NextResponse.json({ orders })
  } catch (error) {
    console.error("Orders fetch error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}
