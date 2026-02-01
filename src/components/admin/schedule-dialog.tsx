"use client"

import { useState } from "react"
import { format } from "date-fns"
import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import { WeekCalendar } from "@/components/admin/week-calendar"
import type { QueueItem } from "@/lib/types"

interface ScheduleDialogProps {
  item: QueueItem | null
  open: boolean
  onOpenChange: (open: boolean) => void
  onSchedule: (itemId: string, appointmentTime: string) => void
  onCancel: () => void
}

export function ScheduleDialog({
  item,
  open,
  onOpenChange,
  onSchedule,
  onCancel,
}: ScheduleDialogProps) {
  const [selectedTime, setSelectedTime] = useState<Date | null>(null)

  const handleSchedule = () => {
    if (!item || !selectedTime) return

    onSchedule(item.id, selectedTime.toISOString())

    // Reset state
    setSelectedTime(null)
  }

  const handleCancel = () => {
    setSelectedTime(null)
    onCancel()
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      handleCancel()
    }
    onOpenChange(newOpen)
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[900px] max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle>Schedule Appointment</DialogTitle>
          <DialogDescription>
            Select a time slot for {item?.discord_username || "this customer"}&apos;s {item?.package_name} session.
            {item?.availability && Object.keys(item.availability).length > 0 && (
              <span className="block mt-1">
                Green slots indicate times within the customer&apos;s availability.
              </span>
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-hidden py-4">
          <WeekCalendar
            availability={item?.availability || null}
            onSelectTime={setSelectedTime}
            selectedTime={selectedTime}
            excludeItemId={item?.id}
          />
        </div>

        {/* Selected time display */}
        {selectedTime && (
          <div className="py-2 px-3 bg-primary/10 rounded-md">
            <Label className="text-sm font-medium">Selected Time</Label>
            <p className="text-lg font-semibold text-primary">
              {format(selectedTime, "EEEE, MMMM d, yyyy 'at' h:mm a")}
            </p>
          </div>
        )}

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button onClick={handleSchedule} disabled={!selectedTime}>
            Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
