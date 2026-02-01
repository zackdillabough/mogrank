import { NextRequest, NextResponse } from "next/server"
import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { auth } from "@/lib/auth"

// Get all sessions for a queue item
export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const queueId = searchParams.get("queue_id")

    if (!queueId) {
      return NextResponse.json({ error: "queue_id required" }, { status: 400 })
    }

    const { data: sessions, error } = await supabase
      .from("sessions")
      .select("*")
      .eq("queue_id", queueId)
      .order("session_number", { ascending: true })

    if (error) {
      console.error("Error fetching sessions:", error)
      return NextResponse.json({ error: "Failed to fetch sessions" }, { status: 500 })
    }

    return NextResponse.json({ sessions })
  } catch (error) {
    console.error("Sessions fetch error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Create a new session
export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = getSupabaseAdmin()
    const body = await request.json()
    const { queue_id, appointment_time } = body

    if (!queue_id) {
      return NextResponse.json({ error: "queue_id required" }, { status: 400 })
    }

    // Get the next session number
    const { data: existingSessions } = await supabase
      .from("sessions")
      .select("session_number")
      .eq("queue_id", queue_id)
      .order("session_number", { ascending: false })
      .limit(1)

    const nextSessionNumber = (existingSessions?.[0]?.session_number || 0) + 1

    const { data, error } = await supabase
      .from("sessions")
      .insert({
        queue_id,
        session_number: nextSessionNumber,
        status: appointment_time ? "scheduled" : "pending",
        appointment_time: appointment_time || null,
      })
      .select()
      .single()

    if (error) {
      console.error("Error creating session:", error)
      return NextResponse.json({ error: "Failed to create session" }, { status: 500 })
    }

    return NextResponse.json({ session: data })
  } catch (error) {
    console.error("Session create error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Update a session
export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = getSupabaseAdmin()
    const body = await request.json()
    const { id, ...updates } = body

    if (!id) {
      return NextResponse.json({ error: "Session ID required" }, { status: 400 })
    }

    const { data, error } = await supabase
      .from("sessions")
      .update(updates)
      .eq("id", id)
      .select()
      .single()

    if (error) {
      console.error("Error updating session:", error)
      return NextResponse.json({ error: "Failed to update session" }, { status: 500 })
    }

    return NextResponse.json({ session: data })
  } catch (error) {
    console.error("Session update error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}

// Delete a session
export async function DELETE(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const supabase = getSupabaseAdmin()
    const { searchParams } = new URL(request.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json({ error: "Session ID required" }, { status: 400 })
    }

    const { error } = await supabase
      .from("sessions")
      .delete()
      .eq("id", id)

    if (error) {
      console.error("Error deleting session:", error)
      return NextResponse.json({ error: "Failed to delete session" }, { status: 500 })
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error("Session delete error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
