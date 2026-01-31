"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { AvailabilityGrid, normalizeAvailability } from "@/components/availability-grid"
import { AvailabilityDisplay } from "@/components/availability-display"
import { Pencil } from "lucide-react"
import type { Availability } from "@/lib/types"

interface AvailabilityEditorProps {
  orderId: string
  availability: Availability | null
  canEdit: boolean
}

export function AvailabilityEditor({ orderId, availability, canEdit }: AvailabilityEditorProps) {
  const [open, setOpen] = useState(false)
  const [value, setValue] = useState<Availability>(availability || {})
  const [saving, setSaving] = useState(false)
  const [inCopyMode, setInCopyMode] = useState(false)

  const handleSave = async () => {
    setSaving(true)
    try {
      // Normalize availability (sort and merge overlapping ranges) before saving
      const normalizedValue = normalizeAvailability(value)

      const response = await fetch(`/api/orders/${orderId}/availability`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ availability: normalizedValue }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || "Failed to update availability")
      }

      setOpen(false)
      // Refresh the page to show updated availability
      window.location.reload()
    } catch (error) {
      console.error("Error saving availability:", error)
      alert(error instanceof Error ? error.message : "Failed to save availability")
    } finally {
      setSaving(false)
    }
  }

  const hasAvailability = availability && Object.keys(availability).length > 0

  return (
    <div>
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">Availability</p>
        {canEdit && (
          <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="sm" className="h-6 px-2">
                <Pencil className="h-3 w-3 mr-1" />
                Edit
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[600px] max-h-[90vh] flex flex-col">
              <DialogHeader>
                <DialogTitle>Update Availability</DialogTitle>
                <DialogDescription>
                  Change the times when you&apos;re available for your session.
                </DialogDescription>
              </DialogHeader>

              <div className="flex-1 overflow-y-auto py-4 -mx-6 px-6">
                <AvailabilityGrid
                  value={value}
                  onChange={setValue}
                  onCopyModeChange={setInCopyMode}
                />
              </div>

              {!inCopyMode && (
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleSave} disabled={saving}>
                    {saving ? "Saving..." : "Save Changes"}
                  </Button>
                </DialogFooter>
              )}
            </DialogContent>
          </Dialog>
        )}
      </div>

      {hasAvailability ? (
        <AvailabilityDisplay availability={availability} />
      ) : (
        <p className="text-sm text-muted-foreground italic">No availability set</p>
      )}
    </div>
  )
}
