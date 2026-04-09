export enum TransactionStatus {
  awaiting_deposit = 'awaiting_deposit',
  processing = 'processing',
  completed = 'completed',
  failed = 'failed',
  refunded = 'refunded',
  cancelled = 'cancelled',
  error = 'error',
}

export enum TransactionType {
  on_ramp = 'on_ramp',
  off_ramp = 'off_ramp',
  wallet_transfer = 'wallet_transfer',
}

export interface TransactionSender {
  amount: number
  currency: string
  payment_rail: string
  name?: string
}

export interface TransactionReceiver {
  amount: number
  currency: string
  payment_rail: string
}

export interface TransactionReceipt {
  unblockpay_fee: number
}

export interface Transaction {
  id: string
  status: TransactionStatus
  type: TransactionType
  sender: TransactionSender
  receiver: TransactionReceiver
  receipt?: TransactionReceipt
  created_at: string
  updated_at: string
  finished_at?: string
  customer_id?: string
}

export interface Customer {
  id: string
  type: 'individual' | 'business'
  email: string
  status: string
  first_name?: string
  last_name?: string
  business_legal_name?: string
  created_at: string
}

export interface ApiResponse<T> {
  data: T | null
  error: string | null
  success: boolean
}

export interface MetricsData {
  tpv_total: number
  tx_count: number
  tx_completed: number
  tx_pending: number
  tx_failed: number
  avg_ticket: number
  tpv_by_day: { date: string; amount: number }[]
  mock?: boolean
}

export interface AgencyData {
  id: string
  name: string
  email: string
  status: string
  tx_count: number
  tpv: number
  last_tx_at: string | null
  mock?: boolean
}
