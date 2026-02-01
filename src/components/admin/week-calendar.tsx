"use client"

import { useState, useEffect, useMemo } from "react"
import {
  startOfWeek,
  endOfWeek,
  addWeeks,
  subWeeks,
  format,
  addDays,
  isSameDay,
  getDay,
  setHours,
  setMinutes,
  isBefore,
  addMinutes,
} from "date-fns"
import { ChevronLeft, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import type { Availability, DayOfWeek, BusinessHours } from "@/lib/types"
import { DEFAULT_BUSINESS_HOURS } from "@/lib/types"

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

interface Appointment {
  id: string
  discord_username: string
  package_name: string
  appointment_time: string
  status: string
  estimated_duration: number
}

interface WeekCalendarProps {
  availability: Availability | null
  onSelectTime: (date: Date) => void
  selectedTime: Date | null
  excludeItemId?: string // Exclude current item from conflict check
}

const SLOT_HEIGHT = 24 // pixels per 30-min slot
const SLOT_DURATION = 30 // minutes

export function WeekCalendar({
  availability,
  onSelectTime,
  selectedTime,
  excludeItemId,
}: WeekCalendarProps) {
  const [currentWeekStart, setCurrentWeekStart] = useState(() =>
    startOfWeek(new Date(), { weekStartsOn: 0 })
  )
  const [appointments, setAppointments] = useState<Appointment[]>([])
  const [businessHours, setBusinessHours] = useState<BusinessHours>(DEFAULT_BUSINESS_HOURS)
  const [maxConcurrentSessions, setMaxConcurrentSessions] = useState(3)
  const [loading, setLoading] = useState(false)

  const weekEnd = useMemo(() => endOfWeek(currentWeekStart, { weekStartsOn: 0 }), [currentWeekStart])
  const days = useMemo(() => Array.from({ length: 7 }, (_, i) => addDays(currentWeekStart, i)), [currentWeekStart])

  // Calculate time slots based on business hours (with 1 hour buffer on each side)
  const timeSlots = useMemo(() => {
    // Find earliest start and latest end across all days
    let earliestStart = 24 * 60 // Start with end of day
    let latestEnd = 0

    for (const day of Object.keys(businessHours) as DayOfWeek[]) {
      const hours = businessHours[day]
      if (hours.enabled) {
        const [startH, startM] = hours.start.split(":").map(Number)
        const [endH, endM] = hours.end.split(":").map(Number)
        earliestStart = Math.min(earliestStart, startH * 60 + startM)
        latestEnd = Math.max(latestEnd, endH * 60 + endM)
      }
    }

    // Add 1 hour buffer on each side, clamped to 0-24
    const bufferMinutes = 60
    const startMinutes = Math.max(0, earliestStart - bufferMinutes)
    const endMinutes = Math.min(24 * 60, latestEnd + bufferMinutes)

    // Generate 30-min slots
    const slots: number[] = []
    for (let m = startMinutes; m < endMinutes; m += SLOT_DURATION) {
      slots.push(m)
    }
    return slots
  }, [businessHours])

  // Fetch appointments and business hours
  useEffect(() => {
    async function fetchData() {
      setLoading(true)
      try {
        // Fetch appointments
        const appointmentsParams = new URLSearchParams({
          start: currentWeekStart.toISOString(),
          end: weekEnd.toISOString(),
        })
        const [appointmentsRes, hoursRes] = await Promise.all([
          fetch(`/api/appointments?${appointmentsParams}`),
          fetch("/api/business-hours"),
        ])

        if (appointmentsRes.ok) {
          const data = await appointmentsRes.json()
          setAppointments(data.appointments || [])
        }

        if (hoursRes.ok) {
          const data = await hoursRes.json()
          setBusinessHours(data.businessHours || DEFAULT_BUSINESS_HOURS)
          setMaxConcurrentSessions(data.maxConcurrentSessions || 3)
        }
      } catch (error) {
        console.error("Failed to fetch data:", error)
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [currentWeekStart, weekEnd])

  // Filter out the current item being scheduled
  const filteredAppointments = useMemo(() => {
    if (!excludeItemId) return appointments
    return appointments.filter((a) => a.id !== excludeItemId)
  }, [appointments, excludeItemId])

  // Check if a day is open for business
  const isDayOpen = (date: Date): boolean => {
    const dayOfWeek = DAY_INDEX_TO_DAY[getDay(date)]
    return businessHours[dayOfWeek]?.enabled ?? false
  }

  // Check if a time slot is within business hours for that day
  const isWithinBusinessHours = (date: Date, slotMinutes: number): boolean => {
    const dayOfWeek = DAY_INDEX_TO_DAY[getDay(date)]
    const hours = businessHours[dayOfWeek]
    if (!hours?.enabled) return false

    const [startH, startM] = hours.start.split(":").map(Number)
    const [endH, endM] = hours.end.split(":").map(Number)
    const startMinutes = startH * 60 + startM
    const endMinutes = endH * 60 + endM

    return slotMinutes >= startMinutes && slotMinutes < endMinutes
  }

  // Check if a time slot is within customer availability
  const isInCustomerAvailability = (date: Date, slotMinutes: number): boolean => {
    if (!availability) return true // No availability set means any time is ok

    const dayOfWeek = DAY_INDEX_TO_DAY[getDay(date)]
    const ranges = availability[dayOfWeek]

    if (!ranges || ranges.length === 0) return false

    return ranges.some((range) => {
      const [startH, startM] = range.start.split(":").map(Number)
      const [endH, endM] = range.end.split(":").map(Number)
      const startMinutes = startH * 60 + startM
      const endMinutes = endH * 60 + endM

      return slotMinutes >= startMinutes && slotMinutes < endMinutes
    })
  }

  // Get all appointments that overlap with a time slot
  const getOverlappingAppointments = (date: Date, slotMinutes: number): Appointment[] => {
    const slotStart = setMinutes(setHours(new Date(date), Math.floor(slotMinutes / 60)), slotMinutes % 60)
    const slotEnd = addMinutes(slotStart, SLOT_DURATION)
    const overlapping: Appointment[] = []

    for (const apt of filteredAppointments) {
      const aptTime = new Date(apt.appointment_time)
      const aptEnd = addMinutes(aptTime, apt.estimated_duration || 60)

      // Check if there's any overlap
      if (slotStart < aptEnd && slotEnd > aptTime) {
        overlapping.push(apt)
      }
    }
    return overlapping
  }

  // Check if slot is at capacity (all concurrent sessions taken)
  const isAtCapacity = (date: Date, slotMinutes: number): boolean => {
    const overlapping = getOverlappingAppointments(date, slotMinutes)
    return overlapping.length >= maxConcurrentSessions
  }

  // Get the first conflict for display purposes
  const getConflict = (date: Date, slotMinutes: number): Appointment | null => {
    const overlapping = getOverlappingAppointments(date, slotMinutes)
    return overlapping.length >= maxConcurrentSessions ? overlapping[0] : null
  }

  // Get count of sessions at this time for display
  const getSessionCount = (date: Date, slotMinutes: number): number => {
    return getOverlappingAppointments(date, slotMinutes).length
  }

  // Check if slot is in the past
  const isPastSlot = (date: Date, slotMinutes: number): boolean => {
    const slotTime = setMinutes(setHours(new Date(date), Math.floor(slotMinutes / 60)), slotMinutes % 60)
    return isBefore(slotTime, new Date())
  }

  // Check if selected time matches this slot
  const isSelected = (date: Date, slotMinutes: number): boolean => {
    if (!selectedTime) return false
    const selectedMinutes = selectedTime.getHours() * 60 + selectedTime.getMinutes()
    return isSameDay(date, selectedTime) && selectedMinutes === slotMinutes
  }

  const handleSlotClick = (date: Date, slotMinutes: number) => {
    if (isPastSlot(date, slotMinutes)) return
    if (!isWithinBusinessHours(date, slotMinutes)) return
    if (!isInCustomerAvailability(date, slotMinutes)) return
    if (isAtCapacity(date, slotMinutes)) return

    const selectedDate = setMinutes(setHours(new Date(date), Math.floor(slotMinutes / 60)), slotMinutes % 60)
    onSelectTime(selectedDate)
  }

  const formatSlotTime = (minutes: number): string => {
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    const date = setMinutes(setHours(new Date(), h), m)
    return format(date, "h:mm a")
  }

  const goToPreviousWeek = () => setCurrentWeekStart(subWeeks(currentWeekStart, 1))
  const goToNextWeek = () => setCurrentWeekStart(addWeeks(currentWeekStart, 1))
  const goToToday = () => setCurrentWeekStart(startOfWeek(new Date(), { weekStartsOn: 0 }))

  return (
    <div className="flex flex-col h-full">
      {/* Header with navigation */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={goToPreviousWeek}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="outline" size="sm" onClick={goToNextWeek}>
            <ChevronRight className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={goToToday}>
            Today
          </Button>
        </div>
        <h3 className="font-medium">
          {format(currentWeekStart, "MMM d")} - {format(weekEnd, "MMM d, yyyy")}
        </h3>
      </div>

      {/* Loading indicator */}
      {loading && (
        <div className="text-center text-sm text-muted-foreground py-2">
          Loading...
        </div>
      )}

      {/* Calendar grid */}
      <div className="flex-1 overflow-auto border rounded-md">
        <div className="min-w-[700px]">
          {/* Day headers */}
          <div className="grid grid-cols-[70px_repeat(7,1fr)] border-b sticky top-0 bg-background z-10">
            <div className="p-2 border-r" /> {/* Empty corner */}
            {days.map((day) => {
              const dayOpen = isDayOpen(day)
              return (
                <div
                  key={day.toISOString()}
                  className={cn(
                    "p-2 text-center border-r last:border-r-0",
                    isSameDay(day, new Date()) && "bg-primary/5",
                    !dayOpen && "bg-muted/30"
                  )}
                >
                  <div className={cn("text-xs", dayOpen ? "text-muted-foreground" : "text-muted-foreground/50")}>
                    {format(day, "EEE")}
                  </div>
                  <div
                    className={cn(
                      "text-lg font-medium",
                      !dayOpen && "text-muted-foreground/50",
                      isSameDay(day, new Date()) &&
                        "bg-primary text-primary-foreground rounded-full w-8 h-8 flex items-center justify-center mx-auto"
                    )}
                  >
                    {format(day, "d")}
                  </div>
                  {!dayOpen && (
                    <div className="text-[10px] text-muted-foreground/50">Closed</div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Time slots */}
          <div className="relative">
            {timeSlots.map((slotMinutes, index) => {
              const isHourMark = slotMinutes % 60 === 0
              return (
                <div
                  key={slotMinutes}
                  className={cn(
                    "grid grid-cols-[70px_repeat(7,1fr)]",
                    isHourMark ? "border-b" : "border-b border-dashed border-muted/50"
                  )}
                  style={{ height: SLOT_HEIGHT }}
                >
                  {/* Time label - only show on hour marks */}
                  <div className={cn(
                    "text-[10px] text-muted-foreground text-right pr-2 border-r flex items-center justify-end",
                    !isHourMark && "text-transparent"
                  )}>
                    {isHourMark ? formatSlotTime(slotMinutes) : ""}
                  </div>

                  {/* Day slots */}
                  {days.map((day) => {
                    const dayOpen = isDayOpen(day)
                    const withinBusiness = isWithinBusinessHours(day, slotMinutes)
                    const inCustomerAvail = isInCustomerAvailability(day, slotMinutes)
                    const atCapacity = isAtCapacity(day, slotMinutes)
                    const sessionCount = getSessionCount(day, slotMinutes)
                    const past = isPastSlot(day, slotMinutes)
                    const selected = isSelected(day, slotMinutes)

                    // Determine slot state
                    const isAvailable = dayOpen && withinBusiness && inCustomerAvail && !atCapacity && !past
                    const isPartiallyBooked = dayOpen && withinBusiness && sessionCount > 0 && !atCapacity && !past
                    const isOutsideBusiness = dayOpen && !withinBusiness
                    const isOutsideCustomer = dayOpen && withinBusiness && !inCustomerAvail && !past

                    return (
                      <div
                        key={`${day.toISOString()}-${slotMinutes}`}
                        className={cn(
                          "border-r last:border-r-0 relative transition-colors",
                          // Closed day
                          !dayOpen && "bg-muted/30",
                          // Past slots
                          past && dayOpen && "bg-muted/20",
                          // Outside business hours (buffer zone)
                          isOutsideBusiness && "bg-muted/10",
                          // Available (within business + customer availability)
                          isAvailable && !isPartiallyBooked && "bg-green-500/10 hover:bg-green-500/20 cursor-pointer",
                          // Partially booked (has sessions but not at capacity)
                          isPartiallyBooked && inCustomerAvail && "bg-yellow-500/15 hover:bg-yellow-500/25 cursor-pointer",
                          // Within business but outside customer availability
                          isOutsideCustomer && "bg-amber-500/5",
                          // At capacity (all sessions taken)
                          atCapacity && "bg-red-500/10",
                          // Selected
                          selected && "bg-primary/20 ring-2 ring-primary ring-inset"
                        )}
                        onClick={() => isAvailable && handleSlotClick(day, slotMinutes)}
                        title={
                          !dayOpen
                            ? "Closed"
                            : past
                              ? "Past time slot"
                              : atCapacity
                                ? `Full (${sessionCount}/${maxConcurrentSessions} sessions)`
                                : isOutsideBusiness
                                  ? "Outside business hours"
                                  : isOutsideCustomer
                                    ? "Outside customer availability"
                                    : sessionCount > 0
                                      ? `${sessionCount}/${maxConcurrentSessions} sessions - ${formatSlotTime(slotMinutes)}`
                                      : `Available - ${formatSlotTime(slotMinutes)}`
                        }
                      >
                        {/* Show session count indicator */}
                        {sessionCount > 0 && withinBusiness && !past && (
                          <div className={cn(
                            "absolute top-0 right-0 text-[8px] font-medium px-0.5 rounded-bl",
                            atCapacity ? "bg-red-500/30 text-red-700" : "bg-yellow-500/30 text-yellow-700"
                          )}>
                            {sessionCount}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {/* Legend */}
      <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground">
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-green-500/20" />
          <span>Available</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-yellow-500/20" />
          <span>Partially booked</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-red-500/20" />
          <span>Full ({maxConcurrentSessions} max)</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-amber-500/10" />
          <span>Outside customer hours</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-muted/30" />
          <span>Closed/Past</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-3 h-3 rounded bg-primary/20 ring-1 ring-primary" />
          <span>Selected</span>
        </div>
      </div>
    </div>
  )
}
