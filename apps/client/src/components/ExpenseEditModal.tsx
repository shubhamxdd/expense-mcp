import { useState, useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import TagInput from './TagInput'
import type { TagInputHandle } from './TagInput'
import ToastContainer, { useToasts } from './Toast'
import { api } from '../services/api'
import type { Expense } from '../types/expense'

interface ExpenseEditModalProps {
  expense: Expense
  onClose: () => void
  onUpdated: (expense: Expense) => void
}

export default function ExpenseEditModal({ expense, onClose, onUpdated }: ExpenseEditModalProps) {
  const [amount, setAmount] = useState(expense.amount.toString())
  const [tags, setTags] = useState<string[]>(expense.tags)
  const [note, setNote] = useState(expense.note)
  const [date, setDate] = useState(expense.date)
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
      const updated = await api.updateExpense(expense.id, { amount: numAmount, tags, note, date })
      onUpdated(updated)
      addToast('Expense updated', 'success')
    } catch (err: any) {
      addToast(err?.message || 'Failed to update expense', 'error')
    }
    setSubmitting(false)
  }

  return (
    <>
      <ToastContainer toasts={toasts} onDismiss={dismissToast} />
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="absolute inset-0 bg-black/30" onClick={onClose} />
        <div className="relative bg-bg-base border border-border-default rounded-[4px] w-full max-w-lg mx-4 shadow-lg">
          <div className="flex items-center justify-between px-4 py-3 border-b border-border-default">
            <h2 className="text-sm font-mono uppercase tracking-wider text-text-primary">Edit Expense</h2>
            <button
              type="button"
              onClick={onClose}
              className="p-1 border-none bg-transparent cursor-pointer text-text-muted hover:text-text-primary"
            >
              <X size={16} />
            </button>
          </div>
          <form onSubmit={handleSubmit} className="p-4 space-y-3">
            <div className="flex items-end gap-3">
              <div className="flex-1">
                <label className="block text-xs text-text-muted mb-1 font-mono uppercase tracking-wider">Amount (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  min="0"
                  value={amount}
                  onChange={e => setAmount(e.target.value)}
                  required
                  className="w-full border-b border-border-default bg-transparent px-0 py-1.5 text-lg font-mono text-text-primary outline-none"
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
            <div className="flex justify-end gap-2 pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-sm text-text-primary border border-border-default rounded-[2px] bg-transparent cursor-pointer hover:bg-bg-hover"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={submitting}
                className="px-4 py-2 text-sm text-white bg-accent-ink rounded-[2px] border-none cursor-pointer hover:opacity-90 disabled:opacity-50"
              >
                {submitting ? 'Saving...' : 'Save'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </>
  )
}