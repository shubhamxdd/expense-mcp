import { Trash2 } from 'lucide-react'
import type { Expense } from '../types/expense'

interface ExpenseListProps {
  expenses: Expense[]
  onDelete: (id: string) => void
}

export default function ExpenseList({ expenses, onDelete }: ExpenseListProps) {
  if (!expenses.length) {
    return <p className="text-text-muted text-sm text-center py-8">No expenses yet.</p>
  }

  return (
    <div className="space-y-1">
      {expenses.map(expense => (
        <div
          key={expense.id}
          className="flex items-center gap-3 px-3 py-2 rounded-[2px] hover:bg-bg-hover transition-colors group"
        >
          <span className="font-mono text-sm text-text-muted w-24 shrink-0">
            {new Date(expense.date).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}
          </span>
          <span className="font-mono text-base text-text-primary w-28 shrink-0 text-right tabular-nums">
            ₹{expense.amount.toLocaleString('en-IN', { minimumFractionDigits: 2 })}
          </span>
          <div className="flex gap-1 flex-1 min-w-0">
            {expense.tags.map(tag => (
              <span
                key={tag}
                className="px-1.5 py-0.5 text-xs rounded-[2px] bg-bg-hover text-text-muted border border-border-default"
              >
                {tag}
              </span>
            ))}
          </div>
          <span className="text-sm text-text-muted flex-1 truncate hidden sm:block">
            {expense.note}
          </span>
          <button
            onClick={() => onDelete(expense.id)}
            className="opacity-0 group-hover:opacity-100 p-1 border-none bg-transparent cursor-pointer text-text-muted hover:text-state-error transition-all"
            title="Delete expense"
          >
            <Trash2 size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}