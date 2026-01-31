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
import { ScheduleDialog } from "./schedule-dialog"
import { StartSessionDialog } from "./start-session-dialog"
import { CompleteSessionDialog } from "./complete-session-dialog"
import { FinishOrderDialog } from "./finish-order-dialog"
import { MoveBackwardDialog } from "./move-backward-dialog"
import { Button } from "@/components/ui/button"
import { Plus } from "lucide-react"
import type { QueueItem, QueueStatus } from "@/lib/types"

// Define status order for detecting backward movements
const STATUS_ORDER: QueueStatus[] = ["new", "scheduled", "in_progress", "review", "finished"]

const isTestMode = process.env.NEXT_PUBLIC_STRIPE_MODE === "test"

interface KanbanBoardProps {
  initialItems: QueueItem[]
}

const columns: { id: QueueStatus; title: string; borderColor: string; dotColor: string; ringColor: string }[] = [
  { id: "new", title: "New", borderColor: "border-slate-500", dotColor: "bg-slate-500", ringColor: "ring-slate-500" },
  { id: "scheduled", title: "Scheduled", borderColor: "border-blue-500", dotColor: "bg-blue-500", ringColor: "ring-blue-500" },
  { id: "in_progress", title: "In Progress", borderColor: "border-orange-500", dotColor: "bg-orange-500", ringColor: "ring-orange-500" },
  { id: "review", title: "Review", borderColor: "border-purple-500", dotColor: "bg-purple-500", ringColor: "ring-purple-500" },
  { id: "finished", title: "Finished", borderColor: "border-emerald-500", dotColor: "bg-emerald-500", ringColor: "ring-emerald-500" },
]

export function KanbanBoard({ initialItems }: KanbanBoardProps) {
  const [items, setItems] = useState<QueueItem[]>(initialItems)
  const [activeId, setActiveId] = useState<string | null>(null)
  const [selectedItem, setSelectedItem] = useState<QueueItem | null>(null)
  const [dialogOpen, setDialogOpen] = useState(false)
  const [scheduleDialogOpen, setScheduleDialogOpen] = useState(false)
  const [pendingScheduleItem, setPendingScheduleItem] = useState<QueueItem | null>(null)
  const [startSessionDialogOpen, setStartSessionDialogOpen] = useState(false)
  const [pendingStartItem, setPendingStartItem] = useState<QueueItem | null>(null)
  const [completeSessionDialogOpen, setCompleteSessionDialogOpen] = useState(false)
  const [pendingCompleteItem, setPendingCompleteItem] = useState<QueueItem | null>(null)
  const [finishOrderDialogOpen, setFinishOrderDialogOpen] = useState(false)
  const [pendingFinishItem, setPendingFinishItem] = useState<QueueItem | null>(null)
  const [moveBackwardDialogOpen, setMoveBackwardDialogOpen] = useState(false)
  const [pendingBackwardItem, setPendingBackwardItem] = useState<QueueItem | null>(null)
  const [pendingBackwardTarget, setPendingBackwardTarget] = useState<QueueStatus | null>(null)

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
      const currentIndex = STATUS_ORDER.indexOf(activeItem.status)
      const targetIndex = STATUS_ORDER.indexOf(targetStatus)
      const isMovingBackward = targetIndex < currentIndex

      // If moving backward, show confirmation dialog
      if (isMovingBackward) {
        setPendingBackwardItem(activeItem)
        setPendingBackwardTarget(targetStatus)
        setMoveBackwardDialogOpen(true)
        setActiveId(null)
        return
      }

      // If moving to scheduled, show the schedule dialog
      if (targetStatus === "scheduled") {
        setPendingScheduleItem(activeItem)
        setScheduleDialogOpen(true)
        setActiveId(null)
        return
      }

      // If moving to in_progress (from new or scheduled), show the start session dialog
      if (targetStatus === "in_progress" && (activeItem.status === "new" || activeItem.status === "scheduled")) {
        setPendingStartItem(activeItem)
        setStartSessionDialogOpen(true)
        setActiveId(null)
        return
      }

      // If moving to review, show the complete session dialog
      if (targetStatus === "review") {
        setPendingCompleteItem(activeItem)
        setCompleteSessionDialogOpen(true)
        setActiveId(null)
        return
      }

      // If moving to finished, show the finish order dialog
      if (targetStatus === "finished") {
        setPendingFinishItem(activeItem)
        setFinishOrderDialogOpen(true)
        setActiveId(null)
        return
      }

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

  const handleScheduleConfirm = async (itemId: string, appointmentTime: string) => {
    // Update local state
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, status: "scheduled" as QueueStatus, appointment_time: appointmentTime }
          : item
      )
    )

    // Update server
    try {
      const response = await fetch("/api/queue/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: itemId,
          status: "scheduled",
          appointment_time: appointmentTime,
        }),
      })

      if (!response.ok) {
        setItems(initialItems)
      }
    } catch (error) {
      console.error("Failed to schedule queue item:", error)
      setItems(initialItems)
    }

    setScheduleDialogOpen(false)
    setPendingScheduleItem(null)
  }

  const handleScheduleCancel = () => {
    setScheduleDialogOpen(false)
    setPendingScheduleItem(null)
  }

  const handleStartSessionConfirm = async (itemId: string, appointmentTime: string, roomCode: string) => {
    // Update local state
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, status: "in_progress" as QueueStatus, appointment_time: appointmentTime, room_code: roomCode }
          : item
      )
    )

    // Update server
    try {
      const response = await fetch("/api/queue/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: itemId,
          status: "in_progress",
          appointment_time: appointmentTime,
          room_code: roomCode,
        }),
      })

      if (!response.ok) {
        setItems(initialItems)
      }
    } catch (error) {
      console.error("Failed to start session:", error)
      setItems(initialItems)
    }

    setStartSessionDialogOpen(false)
    setPendingStartItem(null)
  }

  const handleStartSessionCancel = () => {
    setStartSessionDialogOpen(false)
    setPendingStartItem(null)
  }

  const handleCompleteSessionConfirm = async (itemId: string, notes: string | null) => {
    // Update local state
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, status: "review" as QueueStatus, notes: notes || item.notes }
          : item
      )
    )

    // Update server
    try {
      const response = await fetch("/api/queue/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: itemId,
          status: "review",
          ...(notes && { notes }),
        }),
      })

      if (!response.ok) {
        setItems(initialItems)
      }
    } catch (error) {
      console.error("Failed to complete session:", error)
      setItems(initialItems)
    }

    setCompleteSessionDialogOpen(false)
    setPendingCompleteItem(null)
  }

  const handleCompleteSessionCancel = () => {
    setCompleteSessionDialogOpen(false)
    setPendingCompleteItem(null)
  }

  const handleFinishOrderConfirm = async (itemId: string, proofAdded: boolean) => {
    // Update local state
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, status: "finished" as QueueStatus, proof_added: proofAdded }
          : item
      )
    )

    // Update server
    try {
      const response = await fetch("/api/queue/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: itemId,
          status: "finished",
          proof_added: proofAdded,
        }),
      })

      if (!response.ok) {
        setItems(initialItems)
      }
    } catch (error) {
      console.error("Failed to finish order:", error)
      setItems(initialItems)
    }

    setFinishOrderDialogOpen(false)
    setPendingFinishItem(null)
  }

  const handleFinishOrderCancel = () => {
    setFinishOrderDialogOpen(false)
    setPendingFinishItem(null)
  }

  const handleMoveBackwardConfirm = async (itemId: string, notes: string | null) => {
    if (!pendingBackwardTarget) return

    // Update local state
    setItems((prev) =>
      prev.map((item) =>
        item.id === itemId
          ? { ...item, status: pendingBackwardTarget, notes: notes ? `${item.notes ? item.notes + "\n" : ""}[Moved back: ${notes}]` : item.notes }
          : item
      )
    )

    // Update server
    try {
      const currentItem = items.find(i => i.id === itemId)
      const updatedNotes = notes
        ? `${currentItem?.notes ? currentItem.notes + "\n" : ""}[Moved back: ${notes}]`
        : currentItem?.notes

      const response = await fetch("/api/queue/update", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: itemId,
          status: pendingBackwardTarget,
          ...(updatedNotes && { notes: updatedNotes }),
        }),
      })

      if (!response.ok) {
        setItems(initialItems)
      }
    } catch (error) {
      console.error("Failed to move item backward:", error)
      setItems(initialItems)
    }

    setMoveBackwardDialogOpen(false)
    setPendingBackwardItem(null)
    setPendingBackwardTarget(null)
  }

  const handleMoveBackwardCancel = () => {
    setMoveBackwardDialogOpen(false)
    setPendingBackwardItem(null)
    setPendingBackwardTarget(null)
  }

  const addTestItem = () => {
    const statuses: QueueStatus[] = ["new", "scheduled", "in_progress", "review", "finished"]
    const randomStatus = statuses[Math.floor(Math.random() * statuses.length)]
    const testNames = ["TestUser", "DemoPlayer", "QueueTest", "SampleOrder", "MockClient"]
    const packages = ["1 Prestige", "5 Prestiges", "10 Prestiges", "Max Prestige"]

    const newItem: QueueItem = {
      id: crypto.randomUUID(),
      order_id: crypto.randomUUID(),
      discord_id: "test123",
      discord_username: testNames[Math.floor(Math.random() * testNames.length)],
      package_id: crypto.randomUUID(),
      package_name: packages[Math.floor(Math.random() * packages.length)],
      status: randomStatus,
      availability: null,
      appointment_time: randomStatus === "scheduled" ? new Date(Date.now() + 86400000).toISOString() : null,
      room_code: randomStatus === "in_progress" ? Math.random().toString(36).substring(2, 8).toUpperCase() : null,
      notes: Math.random() > 0.7 ? "This is a test note for the queue item" : null,
      proof_added: randomStatus === "finished" && Math.random() > 0.5,
      missed_count: Math.random() > 0.8 ? Math.floor(Math.random() * 3) + 1 : 0,
      position: items.length,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    }

    setItems((prev) => [...prev, newItem])
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
      {isTestMode && (
        <div className="flex justify-end mb-4">
          <Button variant="outline" size="sm" onClick={addTestItem}>
            <Plus className="h-4 w-4 mr-1" />
            Add Test Item
          </Button>
        </div>
      )}
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
                  borderColor={column.borderColor}
                  dotColor={column.dotColor}
                  ringColor={column.ringColor}
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

      <ScheduleDialog
        item={pendingScheduleItem}
        open={scheduleDialogOpen}
        onOpenChange={setScheduleDialogOpen}
        onSchedule={handleScheduleConfirm}
        onCancel={handleScheduleCancel}
      />

      <StartSessionDialog
        item={pendingStartItem}
        open={startSessionDialogOpen}
        onOpenChange={setStartSessionDialogOpen}
        onStart={handleStartSessionConfirm}
        onCancel={handleStartSessionCancel}
      />

      <CompleteSessionDialog
        item={pendingCompleteItem}
        open={completeSessionDialogOpen}
        onOpenChange={setCompleteSessionDialogOpen}
        onComplete={handleCompleteSessionConfirm}
        onCancel={handleCompleteSessionCancel}
      />

      <FinishOrderDialog
        item={pendingFinishItem}
        open={finishOrderDialogOpen}
        onOpenChange={setFinishOrderDialogOpen}
        onFinish={handleFinishOrderConfirm}
        onCancel={handleFinishOrderCancel}
      />

      <MoveBackwardDialog
        item={pendingBackwardItem}
        targetStatus={pendingBackwardTarget}
        open={moveBackwardDialogOpen}
        onOpenChange={setMoveBackwardDialogOpen}
        onConfirm={handleMoveBackwardConfirm}
        onCancel={handleMoveBackwardCancel}
      />
    </>
  )
}
