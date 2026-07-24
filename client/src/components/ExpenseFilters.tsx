import { useState, useEffect } from 'react'
import { Filter, X } from 'lucide-react'

interface ExpenseFiltersProps {
  tags: string[]
  onFilter: (filters: { from?: string; to?: string; tags?: string[] }) => void
}

export default function ExpenseFilters({ tags, onFilter }: ExpenseFiltersProps) {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    onFilter({ from: from || undefined, to: to || undefined, tags: selectedTags.length ? selectedTags : undefined })
  }, [from, to, selectedTags, onFilter])

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  return (
    <div>
      <button
        onClick={() => setShowFilters(!showFilters)}
        className="flex items-center gap-1.5 px-3 py-1.5 text-sm text-text-muted border border-border-default rounded-[2px] bg-transparent cursor-pointer hover:bg-bg-hover"
      >
        <Filter size={14} />
        Filters
        {(from || to || selectedTags.length) && (
          <span className="ml-1 w-2 h-2 rounded-full bg-accent-ink" />
        )}
      </button>

      {showFilters && (
        <div className="mt-3 p-3 border border-border-default rounded-[4px] bg-bg-surface space-y-3">
          <div className="flex gap-3">
            <div className="flex-1">
              <label className="block text-xs text-text-muted mb-1 font-mono">From</label>
              <input
                type="date"
                value={from}
                onChange={e => setFrom(e.target.value)}
                className="w-full border-b border-border-default bg-transparent px-0 py-1 text-sm text-text-primary outline-none"
              />
            </div>
            <div className="flex-1">
              <label className="block text-xs text-text-muted mb-1 font-mono">To</label>
              <input
                type="date"
                value={to}
                onChange={e => setTo(e.target.value)}
                className="w-full border-b border-border-default bg-transparent px-0 py-1 text-sm text-text-primary outline-none"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs text-text-muted mb-1 font-mono">Tags</label>
            <div className="flex flex-wrap gap-1.5">
              {tags.map(tag => (
                <button
                  key={tag}
                  onClick={() => toggleTag(tag)}
                  className={`px-2 py-0.5 text-xs rounded-[2px] border cursor-pointer transition-colors ${
                    selectedTags.includes(tag)
                      ? 'bg-accent-ink text-white border-accent-ink'
                      : 'bg-transparent text-text-muted border-border-default hover:bg-bg-hover'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>
          {(from || to || selectedTags.length) && (
            <button
              onClick={() => { setFrom(''); setTo(''); setSelectedTags([]) }}
              className="flex items-center gap-1 text-xs text-text-muted hover:text-text-primary border-none bg-transparent cursor-pointer"
            >
              <X size={12} /> Clear filters
            </button>
          )}
        </div>
      )}
    </div>
  )
}