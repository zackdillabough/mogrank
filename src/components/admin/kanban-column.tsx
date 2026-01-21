"use client"

import { useDroppable } from "@dnd-kit/core"
import { cn } from "@/lib/utils"
import { ScrollArea } from "@/components/ui/scroll-area"

interface KanbanColumnProps {
  id: string
  title: string
  color: string
  count: number
  children: React.ReactNode
}

export function KanbanColumn({
  id,
  title,
  color,
  count,
  children,
}: KanbanColumnProps) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div
      ref={setNodeRef}
      className={cn(
        "flex flex-col rounded-lg border",
        color,
        isOver && "ring-2 ring-primary ring-offset-2"
      )}
    >
      <div className="p-3 border-b">
        <div className="flex items-center justify-between">
          <h3 className="font-semibold">{title}</h3>
          <span className="text-sm text-muted-foreground bg-background/50 px-2 py-0.5 rounded-full">
            {count}
          </span>
        </div>
      </div>

      <ScrollArea className="flex-1 p-2">
        <div className="space-y-2 min-h-[200px]">{children}</div>
      </ScrollArea>
    </div>
  )
}
