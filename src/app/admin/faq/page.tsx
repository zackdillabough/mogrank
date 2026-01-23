"use client"

import { useEffect, useState } from "react"
import { Plus, Pencil, Trash2, GripVertical } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { FAQDialog } from "@/components/admin/faq-dialog"
import type { FAQ } from "@/lib/types"
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core"
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable"
import { CSS } from "@dnd-kit/utilities"

function SortableRow({ faq, onDelete, onSuccess }: { faq: FAQ; onDelete: (id: string) => void; onSuccess: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: faq.id })

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  }

  return (
    <TableRow ref={setNodeRef} style={style}>
      <TableCell>
        <button className="cursor-grab active:cursor-grabbing touch-none" {...attributes} {...listeners}>
          <GripVertical className="h-4 w-4 text-muted-foreground" />
        </button>
      </TableCell>
      <TableCell className="font-medium max-w-[300px] truncate">{faq.question}</TableCell>
      <TableCell className="max-w-[300px] truncate text-muted-foreground">{faq.answer}</TableCell>
      <TableCell>
        <Badge variant={faq.active ? "default" : "secondary"}>
          {faq.active ? "Active" : "Inactive"}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <FAQDialog
            faq={faq}
            trigger={
              <Button variant="ghost" size="icon">
                <Pencil className="h-4 w-4" />
              </Button>
            }
            onSuccess={onSuccess}
          />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => onDelete(faq.id)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

export default function FAQPage() {
  const [faqs, setFaqs] = useState<FAQ[]>([])
  const [loading, setLoading] = useState(true)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const fetchFaqs = async () => {
    try {
      const response = await fetch("/api/faq?all=true")
      const data = await response.json()
      setFaqs((data.faqs || []).sort((a: FAQ, b: FAQ) => a.position - b.position))
    } catch (error) {
      console.error("Error fetching FAQs:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchFaqs()
  }, [])

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = faqs.findIndex((f) => f.id === active.id)
    const newIndex = faqs.findIndex((f) => f.id === over.id)
    const reordered = arrayMove(faqs, oldIndex, newIndex)
    setFaqs(reordered)

    try {
      await fetch("/api/faq/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds: reordered.map((f) => f.id) }),
      })
    } catch (error) {
      console.error("Error saving order:", error)
      fetchFaqs()
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this FAQ?")) return

    try {
      const response = await fetch(`/api/faq?id=${id}`, { method: "DELETE" })
      if (response.ok) {
        setFaqs(faqs.filter((f) => f.id !== id))
      }
    } catch (error) {
      console.error("Error deleting FAQ:", error)
    }
  }

  if (loading) {
    return <div className="p-6">Loading...</div>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">FAQ</h2>
          <p className="text-muted-foreground">Manage frequently asked questions</p>
        </div>
        <FAQDialog
          trigger={
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add FAQ
            </Button>
          }
          onSuccess={fetchFaqs}
        />
      </div>

      <div className="border rounded-lg">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead>Question</TableHead>
              <TableHead>Answer</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={faqs.map((f) => f.id)} strategy={verticalListSortingStrategy}>
              <TableBody>
                {faqs.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8 text-muted-foreground">
                      No FAQs yet. Create one to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  faqs.map((faq) => (
                    <SortableRow key={faq.id} faq={faq} onDelete={handleDelete} onSuccess={fetchFaqs} />
                  ))
                )}
              </TableBody>
            </SortableContext>
          </DndContext>
        </Table>
      </div>
    </div>
  )
}
