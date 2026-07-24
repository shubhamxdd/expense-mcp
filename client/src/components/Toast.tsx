import { useState } from 'react'
import { CheckCircle, XCircle, X } from 'lucide-react'

export interface Toast {
  id: string
  message: string
  type: 'success' | 'error'
}

interface ToastContainerProps {
  toasts: Toast[]
  onDismiss: (id: string) => void
}

export default function ToastContainer({ toasts, onDismiss }: ToastContainerProps) {
  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2 max-w-sm">
      {toasts.map(toast => (
        <div
          key={toast.id}
          className={`flex items-start gap-2 px-4 py-3 rounded-[4px] border text-sm shadow-sm transition-all ${
            toast.type === 'success'
              ? 'bg-bg-surface border-state-success text-state-success'
              : 'bg-bg-surface border-state-error text-state-error'
          }`}
        >
          {toast.type === 'success' ? <CheckCircle size={16} className="mt-0.5 shrink-0" /> : <XCircle size={16} className="mt-0.5 shrink-0" />}
          <span className="flex-1">{toast.message}</span>
          <button
            onClick={() => onDismiss(toast.id)}
            className="p-0 border-none bg-transparent cursor-pointer opacity-60 hover:opacity-100 shrink-0"
          >
            <X size={14} />
          </button>
        </div>
      ))}
    </div>
  )
}

export function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = (message: string, type: 'success' | 'error') => {
    const id = `${Date.now()}-${Math.random().toString(36).slice(2, 6)}`
    setToasts(prev => [...prev, { id, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 4000)
  }

  const dismissToast = (id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }

  return { toasts, addToast, dismissToast }
}