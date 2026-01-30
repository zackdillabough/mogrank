"use client"

import { useDroppable } from "@dnd-kit/core"
import { cn } from "@/lib/utils"

interface KanbanColumnProps {
  id: string
  title: string
  borderColor: string
  dotColor: string
  ringColor: string
  count: number
  children: React.ReactNode
}

export function KanbanColumn({
  id,
  title,
  borderColor,
  dotColor,
  ringColor,
  count,
  children,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col rounded-lg border-2 bg-muted/30 min-w-0 overflow-hidden",
        borderColor,
        isOver && ["ring-2 bg-muted/50", ringColor]
      )}
    >
      <div className="px-3 py-2 border-b border-border">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className={cn("w-2 h-2 rounded-full", dotColor)} />
            <h3 className="font-medium text-sm">{title}</h3>
          </div>
          <span className="text-xs text-muted-foreground bg-background px-1.5 py-0.5 rounded">
            {count}
          </span>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto overflow-x-hidden p-2">
        <div className="space-y-2 min-h-[200px]">{children}</div>
      </div>
    </div>
  )
}
