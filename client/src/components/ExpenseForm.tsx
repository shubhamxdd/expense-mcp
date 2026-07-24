import { useState, useEffect, useRef } from 'react'
import { Plus } from 'lucide-react'
import TagInput from './TagInput'
import type { TagInputHandle } from './TagInput'
import ToastContainer, { useToasts } from './Toast'
import { api } from '../services/api'
import type { Expense } from '../types/expense'

interface ExpenseFormProps {
  onExpenseAdded: (expense: Expense) => void
}

export default function ExpenseForm({ onExpenseAdded }: ExpenseFormProps) {
  const [amount, setAmount] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [note, setNote] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)
  const { toasts, addToast, dismissToast } = useToasts()
  const tagInputRef = useRef<TagInputHandle>(null)

  useEffect(() => { api.listTags().then(setSuggestions).catch(() => {}) }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    tagInputRef.current?.commitPending()
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) return
    setSubmitting(true)
    try {
      const expense = await api.createExpense({ amount: numAmount, tags, note, date })
      setAmount('')
      setTags([])
      setNote('')
      setDate(new Date().toISOString().slice(0, 10))
      onExpenseAdded(expense)
      addToast(`₹${numAmount} added for ${tags.join(', ') || 'untagged'}`, 'success')
    } catch (err: any) {
      addToast(err?.message || 'Failed to add expense', 'error')
    }
    setSubmitting(false)
  }

  return (
    <>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <form onSubmit={handleSubmit} className="border border-border-default rounded-[4px] bg-bg-surface p-4 space-y-3">
        <div className="flex items-end gap-3">
          <div className="flex-1">
            <label className="block text-xs text-text-muted mb-1 font-mono uppercase tracking-wider">Amount (₹)</label>
            <input
              type="number"
              step="0.01"
              min="0"
              value={amount}
              onChange={e => setAmount(e.target.value)}
              placeholder="0.00"
              required
              className="w-full border-b border-border-default bg-transparent px-0 py-1.5 text-lg font-mono text-text-primary outline-none placeholder:text-text-muted"
            />
          </div>
          <div className="w-44">
            <label className="block text-xs text-text-muted mb-1 font-mono uppercase tracking-wider">Date</label>
            <input
              type="date"
              value={date}
              onChange={e => setDate(e.target.value)}
              className="w-full border-b border-border-default bg-transparent px-0 py-1.5 text-sm font-sans text-text-primary outline-none"
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className="flex items-center gap-1.5 px-4 py-2 bg-accent-ink text-white text-sm font-medium rounded-[2px] border-none cursor-pointer hover:opacity-90 disabled:opacity-50"
          >
            <Plus size={16} />
            Add
          </button>
        </div>
        <div className="flex gap-3">
          <div className="flex-1">
            <label className="block text-xs text-text-muted mb-1 font-mono uppercase tracking-wider">Tags</label>
            <TagInput tags={tags} suggestions={suggestions} onChange={setTags} ref={tagInputRef} />
          </div>
          <div className="flex-[2]">
            <label className="block text-xs text-text-muted mb-1 font-mono uppercase tracking-wider">Note</label>
            <input
              type="text"
              value={note}
              onChange={e => setNote(e.target.value)}
              placeholder="Optional note..."
              className="w-full border-b border-border-default bg-transparent px-0 py-1.5 text-sm font-sans text-text-primary outline-none placeholder:text-text-muted"
            />
          </div>
        </div>
      </form>
    </>
  )
}