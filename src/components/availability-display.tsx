"use client"

import { cn } from "@/lib/utils"
import type { Availability, DayOfWeek, TimeRange } from "@/lib/types"

const DAYS: DayOfWeek[] = [
  "monday",
  "tuesday",
  "wednesday",
  "thursday",
  "friday",
  "saturday",
  "sunday",
]

const DAY_LABELS: Record<DayOfWeek, string> = {
  monday: "Mon",
  tuesday: "Tue",
  wednesday: "Wed",
  thursday: "Thu",
  friday: "Fri",
  saturday: "Sat",
  sunday: "Sun",
}

// Format time for display (e.g., "18:00" -> "6:00 PM")
function formatTime(time: string): string {
  const [hourStr, minute] = time.split(":")
  const hour = parseInt(hourStr, 10)
  const ampm = hour >= 12 ? "PM" : "AM"
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
  return `${displayHour}:${minute} ${ampm}`
}

// Format a time range for display
function formatTimeRange(range: TimeRange): string {
  return `${formatTime(range.start)} - ${formatTime(range.end)}`
}

// Check if a time falls within a specific range
function isTimeInRange(time: string, range: TimeRange): boolean {
  const [hours, minutes] = time.split(":").map(Number)
  const timeMinutes = hours * 60 + minutes

  const [startHours, startMinutes] = range.start.split(":").map(Number)
  const [endHours, endMinutes] = range.end.split(":").map(Number)
  const startTotalMinutes = startHours * 60 + startMinutes
  const endTotalMinutes = endHours * 60 + endMinutes

  return timeMinutes >= startTotalMinutes && timeMinutes <= endTotalMinutes
}

interface AvailabilityDisplayProps {
  availability: Availability
  compact?: boolean
  highlightDay?: DayOfWeek | null
  highlightTime?: string | null // "HH:mm" format
}

export function AvailabilityDisplay({
  availability,
  compact,
  highlightDay,
  highlightTime,
}: AvailabilityDisplayProps) {
  const daysWithAvailability = DAYS.filter((day) => {
    const ranges = availability[day]
    return ranges && ranges.length > 0
  })

  if (daysWithAvailability.length === 0) {
    return <p className="text-sm text-muted-foreground italic">No availability set</p>
  }

  if (compact) {
    // Show a condensed version
    const totalSlots = daysWithAvailability.reduce(
      (sum, day) => sum + (availability[day]?.length || 0),
      0
    )
    return (
      <p className="text-sm">
        {daysWithAvailability.length} days, {totalSlots} time slot{totalSlots !== 1 ? "s" : ""}
      </p>
    )
  }

  return (
    <div className="space-y-1">
      {daysWithAvailability.map((day) => {
        const ranges = availability[day] || []
        const isDayHighlighted = highlightDay === day

        return (
          <div
            key={day}
            className={cn(
              "flex items-start gap-2 text-sm rounded px-1 -mx-1",
              isDayHighlighted && "bg-primary/10"
            )}
          >
            <span className={cn(
              "font-medium w-10",
              isDayHighlighted && "text-primary"
            )}>
              {DAY_LABELS[day]}:
            </span>
            <span className="text-muted-foreground">
              {ranges.map((range, i) => {
                const isRangeHighlighted = isDayHighlighted && highlightTime && isTimeInRange(highlightTime, range)
                return (
                  <span
                    key={i}
                    className={cn(
                      isRangeHighlighted && "text-primary font-medium"
                    )}
                  >
                    {formatTimeRange(range)}
                    {i < ranges.length - 1 && ", "}
                  </span>
                )
              })}
            </span>
          </div>
        )
      })}
    </div>
  )
}
