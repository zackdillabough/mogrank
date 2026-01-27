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
  appointment_time: string | null
  room_code: string | null
  notes: string | null
  proof_added: boolean
  missed_count: number
  position: number
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

