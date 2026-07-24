import { useState, useCallback } from 'react'
import ExpenseForm from '../components/ExpenseForm'
import ExpenseList from '../components/ExpenseList'
import ExpenseFilters from '../components/ExpenseFilters'
import CurrentMonthTotal from '../components/CurrentMonthTotal'
import { fetchMockExpenses, deleteMockExpense, fetchMockTags } from '../services/mockData'
import type { Expense } from '../types/expense'

export default function Dashboard() {
  const [expenses, setExpenses] = useState<Expense[]>([])
  const [loading, setLoading] = useState(true)
  const [allTags, setAllTags] = useState<string[]>([])

  useState(() => {
    fetchMockTags().then(setAllTags)
    fetchMockExpenses().then(data => { setExpenses(data); setLoading(false) })
  })

  const handleFilter = useCallback(async (filters: { from?: string; to?: string; tags?: string[] }) => {
    setLoading(true)
    const data = await fetchMockExpenses(filters)
    setExpenses(data)
    setLoading(false)
  }, [])

  const handleDelete = async (id: string) => {
    await deleteMockExpense(id)
    setExpenses(prev => prev.filter(e => e.id !== id))
  }

  const handleExpenseAdded = (expense: Expense) => {
    setExpenses(prev => [expense, ...prev])
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
          <ExpenseList expenses={expenses} onDelete={handleDelete} />
        )}
      </div>
    </div>
  )
}