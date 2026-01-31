"use client"

import { useState, useMemo } from "react"
import { format, getDay, parse } from "date-fns"
import { CalendarIcon, Clock, AlertTriangle } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"
import { AvailabilityDisplay } from "@/components/availability-display"
import type { QueueItem, DayOfWeek, Availability } from "@/lib/types"

// Map JS day index (0=Sunday) to our DayOfWeek type
const DAY_INDEX_TO_DAY: DayOfWeek[] = [
  "sunday",
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
]

// Check if a time falls within any of the availability ranges for a day
function isTimeInAvailability(
  time: string,
  availability: Availability | null,
  date: Date
): boolean {
  if (!availability) return true // No availability set, allow any time

  const dayOfWeek = DAY_INDEX_TO_DAY[getDay(date)]
  const ranges = availability[dayOfWeek]

  if (!ranges || ranges.length === 0) return false // No availability for this day

  const [hours, minutes] = time.split(":").map(Number)
  const timeMinutes = hours * 60 + minutes

  return ranges.some((range) => {
    const [startHours, startMinutes] = range.start.split(":").map(Number)
    const [endHours, endMinutes] = range.end.split(":").map(Number)
    const startTotalMinutes = startHours * 60 + startMinutes
    const endTotalMinutes = endHours * 60 + endMinutes

    return timeMinutes >= startTotalMinutes && timeMinutes <= endTotalMinutes
  })
}

// Check if a date has any availability
function dateHasAvailability(date: Date, availability: Availability | null): boolean {
  if (!availability) return true // No availability set, allow any date

  const dayOfWeek = DAY_INDEX_TO_DAY[getDay(date)]
  const ranges = availability[dayOfWeek]

  return ranges !== undefined && ranges.length > 0
}

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
  const [date, setDate] = useState<Date | undefined>(undefined)
  const [time, setTime] = useState("12:00")

  const hasAvailability = !!(item?.availability && Object.keys(item.availability).length > 0)

  // Check if selected time is within customer's availability
  const isTimeValid = useMemo(() => {
    if (!date || !hasAvailability) return true
    return isTimeInAvailability(time, item?.availability || null, date)
  }, [date, time, item?.availability, hasAvailability])

  // Get available time ranges for the selected date
  const availableRangesForDate = useMemo(() => {
    if (!date || !item?.availability) return null
    const dayOfWeek = DAY_INDEX_TO_DAY[getDay(date)]
    return item.availability[dayOfWeek] || null
  }, [date, item?.availability])

  const handleSchedule = () => {
    if (!item || !date) return

    // Combine date and time
    const [hours, minutes] = time.split(":").map(Number)
    const appointmentDate = new Date(date)
    appointmentDate.setHours(hours, minutes, 0, 0)

    onSchedule(item.id, appointmentDate.toISOString())

    // Reset state
    setDate(undefined)
    setTime("12:00")
  }

  const handleCancel = () => {
    setDate(undefined)
    setTime("12:00")
    onCancel()
  }

  const handleOpenChange = (newOpen: boolean) => {
    if (!newOpen) {
      handleCancel()
    }
    onOpenChange(newOpen)
  }

  // Format time range for display
  const formatTimeRange = (start: string, end: string) => {
    const formatTime = (t: string) => {
      const [h, m] = t.split(":").map(Number)
      const ampm = h >= 12 ? "PM" : "AM"
      const hour = h === 0 ? 12 : h > 12 ? h - 12 : h
      return `${hour}:${m.toString().padStart(2, "0")} ${ampm}`
    }
    return `${formatTime(start)} - ${formatTime(end)}`
  }

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Schedule Appointment</DialogTitle>
          <DialogDescription>
            Set a date and time for {item?.discord_username || "this customer"}&apos;s session.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label>Package</Label>
            <p className="text-sm text-muted-foreground">{item?.package_name}</p>
          </div>

          {item?.availability && Object.keys(item.availability).length > 0 && (
            <div className="grid gap-2">
              <Label>Customer Availability</Label>
              <div className="p-3 bg-muted rounded-md">
                <AvailabilityDisplay
                  availability={item.availability}
                  highlightDay={date ? DAY_INDEX_TO_DAY[getDay(date)] : null}
                  highlightTime={date ? time : null}
                />
              </div>
            </div>
          )}

          <div className="grid gap-2">
            <Label>Date</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "justify-start text-left font-normal",
                    !date && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {date ? format(date, "EEEE, MMMM d, yyyy") : "Pick a date"}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={date}
                  onSelect={setDate}
                  initialFocus
                  disabled={(d) => {
                    // Disable past dates
                    if (d < new Date(new Date().setHours(0, 0, 0, 0))) return true
                    // If customer has availability, disable days they're not available
                    if (hasAvailability && !dateHasAvailability(d, item?.availability || null)) return true
                    return false
                  }}
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="grid gap-2">
            <Label htmlFor="time">Time</Label>
            <div className="relative">
              <Clock className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                id="time"
                type="time"
                value={time}
                onChange={(e) => setTime(e.target.value)}
                className="pl-10"
              />
            </div>
            {date && availableRangesForDate && availableRangesForDate.length > 0 && (
              <p className="text-xs text-muted-foreground">
                Available: {availableRangesForDate.map((r, i) => (
                  <span key={i}>
                    {formatTimeRange(r.start, r.end)}
                    {i < availableRangesForDate.length - 1 && ", "}
                  </span>
                ))}
              </p>
            )}
          </div>

          {date && hasAvailability && !isTimeValid && (
            <div className="flex items-start gap-3 p-3 bg-amber-500/10 border border-amber-500/20 rounded-md">
              <AlertTriangle className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-500">Time outside availability</p>
                <p className="text-muted-foreground mt-1">
                  The selected time is not within the customer&apos;s availability window.
                </p>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={handleCancel}>
            Cancel
          </Button>
          <Button
            onClick={handleSchedule}
            disabled={!date || (hasAvailability && !isTimeValid)}
          >
            Schedule
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
