import { useEffect, useState } from 'react'
import type { Expense } from '../types/expense'

interface CurrentMonthTotalProps {
  expenses: Expense[]
}

export default function CurrentMonthTotal({ expenses }: CurrentMonthTotalProps) {
  const [total, setTotal] = useState(0)

  useEffect(() => {
    const now = new Date()
    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
    const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)
    const monthExpenses = expenses.filter(e => e.date >= monthStart && e.date <= monthEnd)
    setTotal(monthExpenses.reduce((sum, e) => sum + e.amount, 0))
  }, [expenses])

  return (
    <div className="border border-border-default rounded-[4px] p-4 bg-bg-surface">
      <span className="text-xs text-text-muted font-mono uppercase tracking-wider">Current Month Total</span>
      <div className="text-2xl font-mono text-text-primary mt-1 tabular-nums">
        ₹{total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
      </div>
    </div>
  )
}