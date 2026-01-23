import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { auth } from "@/lib/auth"

export async function GET(request: NextRequest) {
  try {
    const supabase = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const all = searchParams.get("all")

    let query = supabase.from("faqs").select("*")

    if (!all) {
      query = query.eq("active", true)
    }

    const { data: faqs, error } = await query.order("position", { ascending: true })

    if (error) {
      console.error("Error fetching FAQs:", error)
      return NextResponse.json({ error: "Failed to fetch FAQs" }, { status: 500 })
    }

    return NextResponse.json({ faqs })
  } catch (error) {
    console.error("FAQ fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
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
    const { question, answer, active } = body

    const { data, error } = await supabase
      .from("faqs")
      .insert({ question, answer, active: active ?? true })
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: "Failed to create FAQ" }, { status: 500 })
    }

    return NextResponse.json({ faq: data })
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
      return NextResponse.json({ error: "FAQ ID required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("faqs")
      .update(updates)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: "Failed to update FAQ" }, { status: 500 })
    }

    return NextResponse.json({ faq: data })
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
      return NextResponse.json({ error: "FAQ ID required" }, { status: 400 })
    }

    const { error } = await supabase
      .from("faqs")
      .delete()
      .eq("id", id)

    if (error) {
      return NextResponse.json({ error: "Failed to delete FAQ" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
