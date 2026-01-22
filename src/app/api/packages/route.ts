import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { auth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const all = searchParams.get("all")

    let query = supabase.from("packages").select("*")

    if (!all) {
      query = query.eq("active", true)
    }

    const { data: packages, error } = await query.order("price", { ascending: true })

    if (error) {
      console.error("Error fetching packages:", error)
      return NextResponse.json(
        { error: "Failed to fetch packages" },
        { status: 500 }
      )
    }

    return NextResponse.json({ packages })
  } catch (error) {
    console.error("Packages fetch error:", error)
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    )
  }
}

export async function POST(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const supabase = getSupabaseAdmin()
    const body = await request.json()
    const { name, description, price, levels, duration_minutes, active } = body

    const { data, error } = await supabase
      .from("packages")
      .insert({ name, description, price, levels, duration_minutes, active: active ?? true })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: "Failed to create package" }, { status: 500 })
    }

    return NextResponse.json({ package: data })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function PUT(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const supabase = getSupabaseAdmin()
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: "Package ID required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("packages")
      .update(updates)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: "Failed to update package" }, { status: 500 })
    }

    return NextResponse.json({ package: data })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

export async function DELETE(request: NextRequest) {
  const session = await auth()
  if (!session?.user?.isAdmin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const supabase = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Package ID required" }, { status: 400 })
    }

    const { error } = await supabase
      .from("packages")
      .delete()
      .eq("id", id)

    if (error) {
      return NextResponse.json({ error: "Failed to delete package" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
