export type CreditTransactionType = 'use' | 'add' | 'refund'

export interface CreditTransaction {
  id?: string
  user_id: string
  amount: number
  type: CreditTransactionType
  description: string
  created_at?: string
  task_id?: string
}

export interface UserCredits {
  total: number
  transactions: CreditTransaction[]
} 