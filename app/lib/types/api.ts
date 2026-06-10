/** Shared API types derived from backend route handlers */

export type PointAction =
  | 'subscription'
  | 'pickup_done'
  | 'marketplace_sell'
  | 'marketplace_buy'
  | 'rating'

export interface ApiError {
  error: string
}

export interface Driver {
  name: string
  phone: string
  vehicle: string
  rating: string
}

export interface LeaderboardEntry {
  name: string
  points: number
  badge: string
}

export interface UserPoints {
  user_id: string
  user_name: string
  fullname: string | null
  user_point: number
}

export interface UserPointsResponse {
  user: UserPoints | null
  ranking: number | null
  period: string | null
}

export interface AddPointsResponse {
  success: boolean
  points_added: number
  total_points: number
  ranking: number | null
}

export interface Product {
  id: number
  name: string
  price: number
  description: string
}

export interface RatingPayload {
  user_id: string
  rating: number
  comment?: string
}

export interface RatingResponse {
  success: boolean
  message: string
  data?: unknown
}

export interface ReviewPayload {
  user_id: string
  driver_name: string
  rating: number
  comment?: string
  transaction_type?: 'pickup' | 'marketplace' | string
  weight_kg?: number
}

export interface ReviewResponse {
  success: boolean
  message: string
  points_added: number
  points_status: 'ok' | 'warning'
}

export interface PickupHistory {
  tanggal: string
  hari?: string
  status: 'Selesai' | 'Terjadwal' | 'Dibatalkan'
  petugas?: string
  rating?: number
}

export interface Subscription {
  id: number
  paket: string
  jadwal: string[]
  isPaused: boolean
  riwayat: PickupHistory[]
  paymentMethod?: string
  user_id?: string
}

export interface CreateSubscriptionPayload {
  paket: string
  jadwal: string[]
  isPaused?: boolean
  paymentMethod?: string
  user_id?: string
}

export interface OverpassElement {
  id: number
  lat: number
  lon: number
  tags?: Record<string, string>
}

export interface WasteLocation {
  id: number
  lat: number
  lon: number
  name: string
  address: string
  type: string
}
