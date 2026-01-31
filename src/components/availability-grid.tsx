"use client"

import { useCallback, useState } from "react"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import { Plus, X, Copy, Check } from "lucide-react"
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
  monday: "Monday",
  tuesday: "Tuesday",
  wednesday: "Wednesday",
  thursday: "Thursday",
  friday: "Friday",
  saturday: "Saturday",
  sunday: "Sunday",
}

// Convert "HH:MM" to minutes for comparison
function timeToMinutes(time: string): number {
  const [hours, minutes] = time.split(":").map(Number)
  return hours * 60 + minutes
}

// Convert minutes back to "HH:MM"
function minutesToTime(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}`
}

// Sort ranges by start time and merge overlapping/adjacent ranges
function normalizeRanges(ranges: TimeRange[]): TimeRange[] {
  if (ranges.length <= 1) return ranges

  // Convert to minutes and sort by start time
  const sorted = ranges
    .map((r) => ({
      start: timeToMinutes(r.start),
      end: timeToMinutes(r.end),
    }))
    .sort((a, b) => a.start - b.start)

  // Merge overlapping/adjacent ranges
  const merged: { start: number; end: number }[] = []
  for (const range of sorted) {
    if (merged.length === 0) {
      merged.push(range)
    } else {
      const last = merged[merged.length - 1]
      // If ranges overlap or are adjacent (end >= start), merge them
      if (last.end >= range.start) {
        last.end = Math.max(last.end, range.end)
      } else {
        merged.push(range)
      }
    }
  }

  // Convert back to "HH:MM" format
  return merged.map((r) => ({
    start: minutesToTime(r.start),
    end: minutesToTime(r.end),
  }))
}

// Normalize all days in availability (sort and merge overlapping ranges)
export function normalizeAvailability(availability: Availability): Availability {
  const normalized: Availability = {}
  for (const day of DAYS) {
    const ranges = availability[day]
    if (ranges && ranges.length > 0) {
      normalized[day] = normalizeRanges(ranges)
    }
  }
  return normalized
}


interface AvailabilityGridProps {
  value: Availability
  onChange: (value: Availability) => void
  disabled?: boolean
  onCopyModeChange?: (inCopyMode: boolean) => void
}

export function AvailabilityGrid({ value, onChange, disabled, onCopyModeChange }: AvailabilityGridProps) {
  // Copy mode state
  const [copySource, setCopySource] = useState<DayOfWeek | null>(null)
  const [copyTargets, setCopyTargets] = useState<Set<DayOfWeek>>(new Set())

  // Add a new time range to a day
  const addTimeRange = useCallback(
    (day: DayOfWeek) => {
      if (disabled) return

      const currentRanges = value[day] || []
      // Default to 6 PM - 9 PM for new ranges
      const newRange: TimeRange = { start: "18:00", end: "21:00" }

      onChange({
        ...value,
        [day]: [...currentRanges, newRange],
      })
    },
    [value, onChange, disabled]
  )

  // Remove a time range from a day
  const removeTimeRange = useCallback(
    (day: DayOfWeek, index: number) => {
      if (disabled) return

      const currentRanges = value[day] || []
      const newRanges = currentRanges.filter((_, i) => i !== index)

      onChange({
        ...value,
        [day]: newRanges.length > 0 ? newRanges : undefined,
      })
    },
    [value, onChange, disabled]
  )

  // Update a time range
  const updateTimeRange = useCallback(
    (day: DayOfWeek, index: number, field: "start" | "end", newValue: string) => {
      if (disabled) return

      const currentRanges = value[day] || []
      const newRanges = [...currentRanges]
      newRanges[index] = {
        ...newRanges[index],
        [field]: newValue,
      }

      onChange({
        ...value,
        [day]: newRanges,
      })
    },
    [value, onChange, disabled]
  )

  // Enter copy mode
  const startCopyMode = useCallback((sourceDay: DayOfWeek) => {
    setCopySource(sourceDay)
    // Start with no days selected
    setCopyTargets(new Set())
    onCopyModeChange?.(true)
  }, [onCopyModeChange])

  // Toggle a day in copy targets
  const toggleCopyTarget = useCallback((day: DayOfWeek) => {
    setCopyTargets(prev => {
      const next = new Set(prev)
      if (next.has(day)) {
        next.delete(day)
      } else {
        next.add(day)
      }
      return next
    })
  }, [])

  // Apply copy to selected days
  const applyCopy = useCallback(() => {
    if (!copySource || disabled) return

    const sourceRanges = value[copySource]
    if (!sourceRanges || sourceRanges.length === 0) return

    const newValue: Availability = { ...value }
    for (const day of copyTargets) {
      // Deep copy the ranges
      newValue[day] = sourceRanges.map((r) => ({ ...r }))
    }

    onChange(newValue)
    setCopySource(null)
    setCopyTargets(new Set())
    onCopyModeChange?.(false)
  }, [copySource, copyTargets, value, onChange, disabled, onCopyModeChange])

  // Cancel copy mode
  const cancelCopy = useCallback(() => {
    setCopySource(null)
    setCopyTargets(new Set())
    onCopyModeChange?.(false)
  }, [onCopyModeChange])

  // Clear all availability
  const clearAll = useCallback(() => {
    if (disabled) return
    onChange({})
  }, [onChange, disabled])

  // Count total time ranges
  const totalRanges = DAYS.reduce(
    (acc, day) => acc + (value[day]?.length || 0),
    0
  )

  const inCopyMode = copySource !== null

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {inCopyMode
            ? `Select days to copy ${DAY_LABELS[copySource]}'s schedule to:`
            : totalRanges === 0
              ? "No availability set"
              : `${totalRanges} time slot${totalRanges !== 1 ? "s" : ""} selected`}
        </p>
        {!inCopyMode && totalRanges > 0 && (
          <button
            type="button"
            onClick={clearAll}
            disabled={disabled}
            className="text-xs text-muted-foreground hover:text-foreground disabled:opacity-50"
          >
            Clear all
          </button>
        )}
        {inCopyMode && (
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={cancelCopy}
              className="h-7 px-2 text-xs"
            >
              Cancel
            </Button>
            <Button
              type="button"
              size="sm"
              onClick={applyCopy}
              disabled={copyTargets.size === 0}
              className="h-7 px-2 text-xs"
            >
              <Check className="h-3 w-3 mr-1" />
              Apply
            </Button>
          </div>
        )}
      </div>

      <div>
        {DAYS.map((day) => {
          const ranges = value[day] || []
          const isSource = day === copySource
          const isTarget = inCopyMode && !isSource

          return (
            <div
              key={day}
              className={`flex items-start gap-3 py-3 border-b last:border-b-0 ${
                isSource ? "bg-primary/5 -mx-3 px-3 rounded" : ""
              } ${isTarget && copyTargets.has(day) ? "bg-muted/50 -mx-3 px-3" : ""}`}
            >
              {/* Checkbox for copy mode */}
              {isTarget && (
                <div className="h-8 flex items-center">
                  <Checkbox
                    checked={copyTargets.has(day)}
                    onCheckedChange={() => toggleCopyTarget(day)}
                    disabled={disabled}
                  />
                </div>
              )}

              {/* Day label */}
              <div className={`shrink-0 h-8 flex items-center ${isSource ? "w-36" : "w-24"}`}>
                <span className={`text-sm font-medium ${isSource ? "text-primary" : ""}`}>
                  {DAY_LABELS[day]}
                  {isSource && (
                    <span className="text-[10px] text-primary/70 ml-1">(copying)</span>
                  )}
                </span>
              </div>

              {/* Time ranges */}
              <div className="flex-1 space-y-2">
                {ranges.length === 0 ? (
                  <p className="text-sm text-muted-foreground h-8 flex items-center">
                    No availability
                  </p>
                ) : (
                  ranges.map((range, index) => (
                    <div key={index} className="flex items-center gap-2">
                      <Input
                        type="time"
                        value={range.start}
                        onChange={(e) => updateTimeRange(day, index, "start", e.target.value)}
                        disabled={disabled || inCopyMode}
                        className="w-31 h-8 text-xs"
                      />

                      <span className="text-sm text-muted-foreground">to</span>

                      <Input
                        type="time"
                        value={range.end}
                        onChange={(e) => updateTimeRange(day, index, "end", e.target.value)}
                        disabled={disabled || inCopyMode}
                        className="w-31 h-8 text-xs"
                      />

                      {!inCopyMode && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeTimeRange(day, index)}
                          disabled={disabled}
                          className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))
                )}
              </div>

              {/* Actions */}
              {!inCopyMode && (
                <div className="flex items-center gap-1 h-8">
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={() => addTimeRange(day)}
                    disabled={disabled}
                    className="h-8 px-2 text-xs"
                  >
                    <Plus className="h-3 w-3 mr-1" />
                    Add
                  </Button>

                  {ranges.length > 0 && (
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => startCopyMode(day)}
                      disabled={disabled}
                      className="h-8 px-2 text-xs text-muted-foreground"
                      title="Copy to other days"
                    >
                      <Copy className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      {!inCopyMode && (
        <p className="text-xs text-muted-foreground">
          Add your available time slots for each day. Use the copy button to apply one day&apos;s schedule to other days.
        </p>
      )}
    </div>
  )
}
