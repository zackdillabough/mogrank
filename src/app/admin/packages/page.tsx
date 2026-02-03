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
import { PackageDialog } from "@/components/admin/package-dialog"
import type { Package } from "@/lib/types"
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

function SortableRow({ pkg, onDelete, onSuccess }: { pkg: Package; onDelete: (id: string) => void; onSuccess: () => void }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: pkg.id })

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
      <TableCell className="font-medium">{pkg.name}</TableCell>
      <TableCell>{pkg.header}</TableCell>
      <TableCell>{pkg.subtitle}</TableCell>
      <TableCell>${Number(pkg.price).toFixed(2)}</TableCell>
      <TableCell className="text-muted-foreground">{pkg.estimated_duration} min</TableCell>
      <TableCell>
        <Badge variant={pkg.active ? "default" : "secondary"}>
          {pkg.active ? "Active" : "Inactive"}
        </Badge>
      </TableCell>
      <TableCell className="text-right">
        <div className="flex justify-end gap-2">
          <PackageDialog
            package={pkg}
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
            onClick={() => onDelete(pkg.id)}
          >
            <Trash2 className="h-4 w-4 text-destructive" />
          </Button>
        </div>
      </TableCell>
    </TableRow>
  )
}

export default function PackagesPage() {
  const [packages, setPackages] = useState<Package[]>([])
  const [loading, setLoading] = useState(true)

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  )

  const fetchPackages = async () => {
    try {
      const response = await fetch("/api/packages?all=true")
      const data = await response.json()
      setPackages((data.packages || []).sort((a: Package, b: Package) => a.position - b.position))
    } catch (error) {
      console.error("Error fetching packages:", error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPackages()
  }, [])

  const handleDragEnd = async (event: DragEndEvent) => {
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIndex = packages.findIndex((p) => p.id === active.id)
    const newIndex = packages.findIndex((p) => p.id === over.id)
    const reordered = arrayMove(packages, oldIndex, newIndex)
    setPackages(reordered)

    try {
      await fetch("/api/packages/reorder", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderedIds: reordered.map((p) => p.id) }),
      })
    } catch (error) {
      console.error("Error saving order:", error)
      fetchPackages()
    }
  }

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to delete this package?")) return

    try {
      const response = await fetch(`/api/packages?id=${id}`, { method: "DELETE" })
      if (response.ok) {
        fetchPackages()
      }
    } catch (error) {
      console.error("Error deleting package:", error)
    }
  }

  if (loading) {
    return <p className="text-muted-foreground">Loading packages...</p>
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Packages</h1>
        <PackageDialog
          trigger={
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Package
            </Button>
          }
          onSuccess={fetchPackages}
        />
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-10" />
              <TableHead>Name</TableHead>
              <TableHead>Header</TableHead>
              <TableHead>Subtitle</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Duration</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
            <SortableContext items={packages.map((p) => p.id)} strategy={verticalListSortingStrategy}>
              <TableBody>
                {packages.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                      No packages yet. Create one to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  packages.map((pkg) => (
                    <SortableRow key={pkg.id} pkg={pkg} onDelete={handleDelete} onSuccess={fetchPackages} />
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
