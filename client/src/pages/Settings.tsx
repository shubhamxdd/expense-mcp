import { useState } from 'react'
import { Key, Plus, Trash2, Copy, Check, User } from 'lucide-react'
import { mockUser, mockApiKeys as initialKeys, generateId } from '../services/mockData'

export default function Settings() {
  const [apiKeys, setApiKeys] = useState(initialKeys)
  const [newLabel, setNewLabel] = useState('')
  const [justCreated, setJustCreated] = useState<string | null>(null)
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null)

  const createKey = () => {
    if (!newLabel.trim()) return
    const rawKey = `exp_${generateId().replace(/-/g, '').slice(0, 24)}`
    const key = {
      id: generateId(),
      label: newLabel,
      created_at: new Date().toISOString(),
      last_used_at: null,
      revoked_at: null,
      key_preview: rawKey.slice(0, 5) + '••••' + rawKey.slice(-4),
    }
    setApiKeys(prev => [key, ...prev])
    setJustCreated(rawKey)
    setNewLabel('')
  }

  const revokeKey = (id: string) => {
    setApiKeys(prev => prev.map(k => k.id === id ? { ...k, revoked_at: new Date().toISOString() } : k))
  }

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text)
    setCopiedIndex(id)
    setTimeout(() => setCopiedIndex(null), 2000)
  }

  return (
    <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
      <h1 className="text-2xl font-heading text-text-primary">Settings</h1>

      <section className="border border-border-default rounded-[4px] p-4 bg-bg-surface space-y-3">
        <h2 className="text-sm font-mono text-text-muted uppercase tracking-wider">Connected Account</h2>
        <div className="flex items-center gap-3">
          <User size={20} className="text-text-muted" />
          <div>
            <p className="text-text-primary font-medium">{mockUser.name}</p>
            <p className="text-text-muted text-sm">{mockUser.email}</p>
          </div>
        </div>
        <p className="text-xs text-text-muted">
          Your expenses are stored in a Google Sheet named "Expense Tracker — {mockUser.name}".
        </p>
      </section>

      <section className="space-y-4">
        <h2 className="text-sm font-mono text-text-muted uppercase tracking-wider">API Keys</h2>

        <div className="flex gap-2">
          <input
            type="text"
            value={newLabel}
            onChange={e => setNewLabel(e.target.value)}
            placeholder="Key label (e.g. Claude Desktop)"
            className="flex-1 border-b border-border-default bg-transparent px-0 py-1.5 text-sm text-text-primary outline-none placeholder:text-text-muted"
            onKeyDown={e => e.key === 'Enter' && createKey()}
          />
          <button
            onClick={createKey}
            disabled={!newLabel.trim()}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-ink text-white text-sm rounded-[2px] border-none cursor-pointer hover:opacity-90 disabled:opacity-50"
          >
            <Plus size={14} /> Generate
          </button>
        </div>

        {justCreated && (
          <div className="border border-state-success rounded-[4px] p-3 bg-bg-surface space-y-2">
            <p className="text-xs text-state-success font-mono uppercase tracking-wider">Key created — copy it now, it won't be shown again</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 px-2 py-1 text-sm bg-bg-hover rounded-[2px] font-mono break-all">{justCreated}</code>
              <button
                onClick={() => copyToClipboard(justCreated, 'new')}
                className="flex items-center gap-1 px-2 py-1 text-sm border border-border-default rounded-[2px] bg-transparent cursor-pointer hover:bg-bg-hover text-text-muted"
              >
                {copiedIndex === 'new' ? <Check size={14} className="text-state-success" /> : <Copy size={14} />}
              </button>
            </div>
            <button
              onClick={() => setJustCreated(null)}
              className="text-xs text-text-muted hover:text-text-primary border-none bg-transparent cursor-pointer"
            >
              Dismiss
            </button>
          </div>
        )}

        {apiKeys.length === 0 ? (
          <p className="text-sm text-text-muted">No API keys yet.</p>
        ) : (
          <div className="space-y-2">
            {apiKeys.map(key => (
              <div
                key={key.id}
                className={`flex items-center gap-3 px-3 py-2 border border-border-default rounded-[2px] ${
                  key.revoked_at ? 'opacity-50' : 'bg-bg-surface'
                }`}
              >
                <Key size={14} className="text-text-muted shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary font-medium">{key.label}</p>
                  <p className="text-xs font-mono text-text-muted">{key.key_preview}</p>
                </div>
                <div className="text-xs text-text-muted text-right shrink-0">
                  <p>{new Date(key.created_at).toLocaleDateString('en-IN')}</p>
                  {key.last_used_at && <p className="text-xs">Last used: {new Date(key.last_used_at).toLocaleDateString('en-IN')}</p>}
                </div>
                {key.revoked_at ? (
                  <span className="text-xs text-state-error font-mono">Revoked</span>
                ) : (
                  <button
                    onClick={() => revokeKey(key.id)}
                    className="p-1 border-none bg-transparent cursor-pointer text-text-muted hover:text-state-error"
                    title="Revoke key"
                  >
                    <Trash2 size={14} />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  )
}