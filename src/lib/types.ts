export type OrderStatus =
  | 'pending_payment'
  | 'paid'
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
  description: string
  price: number // in USD
  levels: number
  duration_minutes: number | null
  image_url: string | null
  active: boolean
  created_at: string
}

export interface Order {
  id: string
  ramp_order_id: string | null
  discord_id: string | null
  discord_username: string | null
  discord_avatar: string | null
  package_id: string
  package_name: string
  amount: number
  status: OrderStatus
  wallet_address: string | null
  crypto_amount: string | null
  crypto_currency: string | null
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

// Ramp Network webhook payload types
export interface RampWebhookPayload {
  type: string
  purchase: {
    id: string
    endTime: string | null
    asset: {
      symbol: string
      chain: string
      type: string
      address: string | null
      name: string
      decimals: number
    }
    receiverAddress: string
    cryptoAmount: string
    fiatCurrency: string
    fiatValue: number
    assetExchangeRate: number
    baseRampFee: number
    networkFee: number
    appliedFee: number
    paymentMethodType: string
    finalTxHash: string | null
    createdAt: string
    updatedAt: string
    status: 'INITIALIZED' | 'PAYMENT_STARTED' | 'PAYMENT_IN_PROGRESS' | 'PAYMENT_FAILED' | 'PAYMENT_EXECUTED' | 'FIAT_SENT' | 'FIAT_RECEIVED' | 'RELEASING' | 'RELEASED' | 'EXPIRED' | 'CANCELLED'
    escrowAddress: string | null
    escrowDetailsHash: string | null
  }
}
