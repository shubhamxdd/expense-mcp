import { useState, useRef, forwardRef, useImperativeHandle, type KeyboardEvent } from 'react'
import { X } from 'lucide-react'

export interface TagInputHandle {
  commitPending: () => void
}

interface TagInputProps {
  tags: string[]
  suggestions: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
}

const TagInput = forwardRef<TagInputHandle, TagInputProps>(
  function TagInput({ tags, suggestions, onChange, placeholder = 'Add tag...' }, ref) {
    const [input, setInput] = useState('')
    const [showSuggestions, setShowSuggestions] = useState(false)
    const inputRef = useRef<HTMLInputElement>(null)
    const blurTimer = useRef<number | null>(null)

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

    useImperativeHandle(ref, () => ({
      commitPending: () => {
        if (input.trim()) addTag(input)
      },
    }))

    const handleBlur = () => {
      blurTimer.current = window.setTimeout(() => setShowSuggestions(false), 150)
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
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            placeholder={tags.length ? '' : placeholder}
            className="flex-1 min-w-[80px] border-none bg-transparent outline-none text-sm text-text-primary placeholder:text-text-muted"
          />
        </div>
        {showSuggestions && input && (
          <div className="absolute top-full left-0 right-0 z-10 mt-1 bg-bg-surface border border-border-default rounded-[2px] shadow-sm">
            {filtered.map(s => (
              <button
                key={s}
                type="button"
                onMouseDown={e => {
                  e.preventDefault()
                  clearTimeout(blurTimer.current ?? undefined)
                  addTag(s)
                }}
                className="block w-full text-left px-3 py-1.5 text-sm text-text-primary hover:bg-bg-hover border-none bg-transparent cursor-pointer"
              >
                {s}
              </button>
            ))}
            {!tags.includes(input.trim().toLowerCase()) && (
              <button
                type="button"
                onMouseDown={e => {
                  e.preventDefault()
                  clearTimeout(blurTimer.current ?? undefined)
                  addTag(input)
                }}
                className="block w-full text-left px-3 py-1.5 text-sm text-text-primary border-t border-border-default hover:bg-bg-hover border-l-0 border-r-0 border-b-0 bg-transparent cursor-pointer"
              >
                + Create &ldquo;{input.trim().toLowerCase()}&rdquo;
              </button>
            )}
          </div>
        )}
      </div>
    )
  }
)

export default TagInput