"use client"

import { useSortable } from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"
import { format } from "date-fns"
import { cn } from "@/lib/utils"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import type { QueueItem } from "@/lib/types"

interface KanbanCardProps {
  item: QueueItem
  isDragging?: boolean
  onClick?: () => void
}

export function KanbanCard({ item, isDragging, onClick }: KanbanCardProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: item.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  }

  return (
    <Card
      ref={setNodeRef}
      style={style}
      className={cn(
        "cursor-pointer hover:shadow-md transition-shadow py-0 gap-0 min-w-0 overflow-hidden",
        (isDragging || isSortableDragging) && "opacity-50 shadow-lg"
      )}
      onClick={onClick}
      {...attributes}
      {...listeners}
    >
      <CardContent className="px-2.5 py-2 space-y-0.5 overflow-hidden">
        <div className="flex items-center justify-between">
          <span className="font-medium text-sm truncate">
            {item.discord_username || "Anonymous"}
          </span>
          {item.missed_count > 0 && (
            <Badge variant="destructive" className="text-xs">
              {item.missed_count} missed
            </Badge>
          )}
        </div>

        <div className="text-xs text-muted-foreground truncate">
          {item.package_name}
        </div>

        {item.appointment_time && (
          <div className="text-xs">
            <span className="text-muted-foreground">Appt: </span>
            <span className="font-medium">
              {format(new Date(item.appointment_time), "MMM d, HH:mm")}
            </span>
          </div>
        )}

        {item.room_code && (
          <div className="text-xs">
            <span className="text-muted-foreground">Room: </span>
            <code className="bg-muted px-1 rounded">{item.room_code}</code>
          </div>
        )}

        {item.notes && (
          <p className="text-xs text-muted-foreground truncate">
            {item.notes}
          </p>
        )}

        <div className="flex items-center justify-between pt-1.5 mt-1.5 border-t">
          <span className="text-xs text-muted-foreground font-mono">
            {item.order_id?.slice(0, 8)}
          </span>
          {item.proof_added && (
            <Badge variant="outline" className="text-xs">
              Proof
            </Badge>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
