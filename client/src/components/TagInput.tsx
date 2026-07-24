import { useState, useRef, type KeyboardEvent } from 'react'
import { X } from 'lucide-react'

interface TagInputProps {
  tags: string[]
  suggestions: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
}

export default function TagInput({ tags, suggestions, onChange, placeholder = 'Add tag...' }: TagInputProps) {
  const [input, setInput] = useState('')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = suggestions.filter(
    s => s.toLowerCase().includes(input.toLowerCase()) && !tags.includes(s)
  )

  const addTag = (tag: string) => {
    const trimmed = tag.trim().toLowerCase()
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed])
    }
    setInput('')
    setShowSuggestions(false)
    inputRef.current?.focus()
  }

  const removeTag = (tag: string) => {
    onChange(tags.filter(t => t !== tag))
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addTag(input)
    } else if (e.key === 'Backspace' && !input && tags.length) {
      removeTag(tags[tags.length - 1])
    }
  }

  return (
    <div className="relative">
      <div className="flex flex-wrap items-center gap-1.5 px-2 py-1.5 border-b border-border-default bg-transparent min-h-[36px]">
        {tags.map(tag => (
          <span
            key={tag}
            className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-[2px] bg-bg-hover text-text-primary border border-border-default"
          >
            {tag}
            <button
              type="button"
              onClick={() => removeTag(tag)}
              className="p-0 border-none bg-transparent cursor-pointer text-text-muted hover:text-text-primary"
            >
              <X size={12} />
            </button>
          </span>
        ))}
        <input
          ref={inputRef}
          type="text"
          value={input}
          onChange={e => { setInput(e.target.value); setShowSuggestions(true) }}
          onFocus={() => setShowSuggestions(true)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 150)}
          onKeyDown={handleKeyDown}
          placeholder={tags.length ? '' : placeholder}
          className="flex-1 min-w-[80px] border-none bg-transparent outline-none text-sm text-text-primary placeholder:text-text-muted"
        />
      </div>
      {showSuggestions && input && filtered.length > 0 && (
        <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-bg-surface border border-border-default rounded-[2px] shadow-sm">
          {filtered.map(s => (
            <button
              key={s}
              type="button"
              onMouseDown={e => e.preventDefault()}
              onClick={() => addTag(s)}
              className="block w-full text-left px-3 py-1.5 text-sm text-text-primary hover:bg-bg-hover border-none bg-transparent cursor-pointer"
            >
              {s}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}