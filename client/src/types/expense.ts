export interface Expense {
  id: string
  date: string
  amount: number
  tags: string[]
  note: string
  created_at: string
}

export interface ExpenseSummary {
  byTag: { tag: string; total: number }[]
  byMonth: { month: string; total: number }[]
}

export interface User {
  id: string
  email: string
  name: string
}

export interface ApiKey {
  id: string
  label: string
  created_at: string
  last_used_at: string | null
  revoked_at: string | null
  key_preview: string
}