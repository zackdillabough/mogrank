// Time range for availability (24-hour format, e.g., "18:00" to "21:30")
export interface TimeRange {
  start: string // "HH:mm" format
  end: string   // "HH:mm" format
}

// Availability is a weekly schedule with time ranges per day
export type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday'

export type Availability = {
  [day in DayOfWeek]?: TimeRange[]
}

export type OrderStatus =
  | 'in_queue'
  | 'scheduled'
  | 'in_progress'
  | 'review'
  | 'completed'
  | 'missed'
  | 'dispute'
  | 'refunded'

export type QueueStatus = 'new' | 'scheduled' | 'in_progress' | 'review' | 'finished'

export interface Package {
  id: string
  name: string
  header: string
  subtitle: string
  description: string | null
  price: number // in USD
  image_url: string | null
  active: boolean
  position: number
  estimated_duration: number // Duration in minutes
  created_at: string
}

export interface Order {
  id: string
  stripe_session_id: string | null
  stripe_payment_intent_id: string | null
  discord_id: string | null
  discord_username: string | null
  discord_avatar: string | null
  package_id: string
  package_name: string
  amount: number
  refunded_amount: number | null
  availability: Availability | null
  status: OrderStatus
  created_at: string
  updated_at: string
  paid_at: string | null
}

export interface QueueItem {
  id: string
  order_id: string
  discord_id: string | null
  discord_username: string | null
  package_id: string
  package_name: string
  status: QueueStatus
  availability: Availability | null
  appointment_time: string | null
  room_code: string | null
  notes: string | null
  proof_added: boolean
  missed_count: number
  position: number
  created_at: string
  updated_at: string
  // Multi-session support
  sessions?: Session[]
}

export type SessionStatus = 'pending' | 'scheduled' | 'in_progress' | 'completed' | 'missed'

export interface Session {
  id: string
  queue_id: string
  session_number: number
  status: SessionStatus
  appointment_time: string | null
  room_code: string | null
  notes: string | null
  proof_added: boolean
  missed: boolean
  created_at: string
  updated_at: string
}

export interface User {
  id: string
  discord_id: string
  discord_username: string
  discord_avatar: string | null
  is_admin: boolean
  created_at: string
  updated_at: string
}

export interface FAQ {
  id: string
  question: string
  answer: string
  position: number
  active: boolean
  created_at: string
}

// Business hours for a single day
export interface DayHours {
  enabled: boolean
  start: string // "HH:mm" format
  end: string   // "HH:mm" format
}

// Business hours for the whole week
export type BusinessHours = {
  [day in DayOfWeek]: DayHours
}

// Default business hours (2 PM - 10 PM every day)
export const DEFAULT_BUSINESS_HOURS: BusinessHours = {
  sunday: { enabled: true, start: "14:00", end: "22:00" },
  monday: { enabled: true, start: "14:00", end: "22:00" },
  tuesday: { enabled: true, start: "14:00", end: "22:00" },
  wednesday: { enabled: true, start: "14:00", end: "22:00" },
  thursday: { enabled: true, start: "14:00", end: "22:00" },
  friday: { enabled: true, start: "14:00", end: "22:00" },
  saturday: { enabled: true, start: "14:00", end: "22:00" },
}

