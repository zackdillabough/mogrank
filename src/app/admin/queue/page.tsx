import { getSupabaseAdmin } from "@/lib/supabase/admin"
import { KanbanBoard } from "@/components/admin/kanban-board"
import type { QueueItem } from "@/lib/types"

async function getQueueItems(): Promise<QueueItem[]> {
  const supabase = getSupabaseAdmin()
  const { data, error } = await supabase
    .from("queue")
    .select("*")
    .order("position", { ascending: true })
    .order("created_at", { ascending: true })

  if (error) {
    console.error("Error fetching queue:", error)
    return []
  }

  return data || []
}

export default async function QueuePage() {
  const items = await getQueueItems()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Queue Management</h1>
      </div>

      <KanbanBoard initialItems={items} />
    </div>
  )
}
