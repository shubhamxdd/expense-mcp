import { useState, useEffect, useCallback } from 'react'
import ExpenseForm from '../components/ExpenseForm'
import ExpenseList from '../components/ExpenseList'
import ExpenseFilters from '../components/ExpenseFilters'
import CurrentMonthTotal from '../components/CurrentMonthTotal'
import ExpenseEditModal from '../components/ExpenseEditModal'
import { api } from '../services/api'
import type { Expense } from '../types/expense'

export default function Dashboard() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [allTags, setAllTags] = useState<string[]>([])
  const [loading, setLoading] = useState(true)
  const [editingExpense, setEditingExpense] = useState<Expense | null>(null)

  const loadExpenses = useCallback(async (filters?: { from?: string; to?: string; tags?: string }) => {
    setLoading(true)
    try {
      const data = await api.listExpenses(filters)
      setExpenses(data)
    } catch {
      setExpenses([])
    }
    setLoading(false)
  }, [])

  useEffect(() => {
    api.listTags().then(setAllTags).catch(() => {})
    loadExpenses()
  }, [loadExpenses])

  const handleFilter = useCallback((filters: { from?: string; to?: string; tags?: string[] }) => {
    loadExpenses({
      from: filters.from,
      to: filters.to,
      tags: filters.tags?.join(','),
    })
  }, [loadExpenses])

  const handleDelete = async (id: string) => {
    try {
      await api.deleteExpense(id)
      setExpenses(prev => prev.filter(e => e.id !== id))
    } catch {}
  }

  const handleExpenseAdded = (expense: Expense) => {
    setExpenses(prev => [expense, ...prev])
  }

  const handleExpenseUpdated = (updated: Expense) => {
    setExpenses(prev => prev.map(e => e.id === updated.id ? updated : e))
    setEditingExpense(null)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-6">
      <h1 className="text-2xl font-heading text-text-primary">Dashboard</h1>
      <ExpenseForm onExpenseAdded={handleExpenseAdded} />
      <CurrentMonthTotal expenses={expenses} />
      <div>
        <ExpenseFilters tags={allTags} onFilter={handleFilter} />
      </div>
      <div>
        <div className="flex items-center px-3 py-1.5 text-xs font-mono text-text-muted uppercase tracking-wider border-b border-border-default">
          <span className="w-24">Date</span>
          <span className="w-28 text-right">Amount</span>
          <span className="flex-1 pl-2">Tags</span>
          <span className="flex-1 hidden sm:block">Note</span>
          <span className="w-6" />
        </div>
        {loading ? (
          <p className="text-text-muted text-sm text-center py-8">Loading...</p>
        ) : (
          <ExpenseList expenses={expenses} onEdit={setEditingExpense} onDelete={handleDelete} />
        )}
      </div>
      {editingExpense && (
        <ExpenseEditModal
          expense={editingExpense}
          onClose={() => setEditingExpense(null)}
          onUpdated={handleExpenseUpdated}
        />
      )}
    </div>
  )
}