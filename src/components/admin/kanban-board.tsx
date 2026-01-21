"use client"

import { useState, useCallback } from "react"
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragStartEvent,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { KanbanColumn } from "./kanban-column"
import { KanbanCard } from "./kanban-card"
import { QueueItemDialog } from "./queue-item-dialog"
import type { QueueItem, QueueStatus } from "@/lib/types"

interface KanbanBoardProps {
  initialItems: QueueItem[]
}

const columns: { id: QueueStatus; title: string; color: string }[] = [
  { id: "new", title: "New", color: "bg-slate-100 dark:bg-slate-800" },
  { id: "scheduled", title: "Scheduled", color: "bg-blue-100 dark:bg-blue-900" },
  { id: "in_progress", title: "In Progress", color: "bg-orange-100 dark:bg-orange-900" },
  { id: "review", title: "Review", color: "bg-purple-100 dark:bg-purple-900" },
  { id: "finished", title: "Finished", color: "bg-emerald-100 dark:bg-emerald-900" },
]

export function KanbanBoard({ initialItems }: KanbanBoardProps) {
  const [items, setItems] = useState<QueueItem[]>(initialItems)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<QueueItem | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const getItemsByStatus = useCallback(
    (status: QueueStatus) => items.filter((item) => item.status === status),
    [items]
  )

  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string)
  }

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event

    if (!over) {
      setActiveId(null)
      return
    }

    const activeItem = items.find((item) => item.id === active.id)
    if (!activeItem) {
      setActiveId(null)
      return
    }

    // Determine target column
    let targetStatus: QueueStatus

    // Check if dropped on a column or another item
    const overItem = items.find((item) => item.id === over.id)
    if (overItem) {
      targetStatus = overItem.status
    } else {
      // Dropped on column directly
      targetStatus = over.id as QueueStatus
    }

    if (activeItem.status !== targetStatus) {
      // Update local state
      setItems((prev) =>
        prev.map((item) =>
          item.id === activeItem.id ? { ...item, status: targetStatus } : item
        )
      )

      // Update server
      try {
        const response = await fetch("/api/queue/update", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: activeItem.id,
            status: targetStatus,
          }),
        })

        if (!response.ok) {
          // Revert on error
          setItems(initialItems)
        }
      } catch (error) {
        console.error("Failed to update queue item:", error)
        setItems(initialItems)
      }
    }

    setActiveId(null)
  }

  const handleItemClick = (item: QueueItem) => {
    setSelectedItem(item)
    setDialogOpen(true)
  }

  const handleItemUpdate = async (updatedItem: Partial<QueueItem> & { id: string }) => {
    // Update local state
    setItems((prev) =>
      prev.map((item) =>
        item.id === updatedItem.id ? { ...item, ...updatedItem } : item
      )
    )

    // Update server
    try {
      const response = await fetch("/api/queue/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updatedItem),
      })

      if (!response.ok) {
        // Revert on error
        setItems(initialItems)
      }
    } catch (error) {
      console.error("Failed to update queue item:", error)
      setItems(initialItems)
    }

    setDialogOpen(false)
    setSelectedItem(null)
  }

  const activeItem = activeId ? items.find((item) => item.id === activeId) : null

  return (
    <>
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-5 gap-4 min-h-[600px]">
          {columns.map((column) => {
            const columnItems = getItemsByStatus(column.id)
            return (
              <SortableContext
                key={column.id}
                items={columnItems.map((item) => item.id)}
                strategy={verticalListSortingStrategy}
              >
                <KanbanColumn
                  id={column.id}
                  title={column.title}
                  color={column.color}
                  count={columnItems.length}
                >
                  {columnItems.map((item) => (
                    <KanbanCard
                      key={item.id}
                      item={item}
                      onClick={() => handleItemClick(item)}
                    />
                  ))}
                </KanbanColumn>
              </SortableContext>
            )
          })}
        </div>

        <DragOverlay>
          {activeItem && (
            <KanbanCard item={activeItem} isDragging />
          )}
        </DragOverlay>
      </DndContext>

      <QueueItemDialog
        item={selectedItem}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onUpdate={handleItemUpdate}
      />
    </>
  )
}
