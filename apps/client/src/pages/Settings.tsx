import { useState, useEffect } from 'react'
import { Key, Plus, Trash2, Copy, Check, User, Bot } from 'lucide-react'
import { api } from '../services/api'

export default function Settings() {
  const [apiKeys, setApiKeys] = useState<any[]>([])
  const [newLabel, setNewLabel] = useState('')
  const [justCreated, setJustCreated] = useState<string | null>(null)
  const [copiedIndex, setCopiedIndex] = useState<string | null>(null)
  const [userInfo, setUserInfo] = useState<{ id: string; email: string } | null>(null)
  const [mcpCreds, setMcpCreds] = useState<any>(null)
  const [loading, setLoading] = useState(false)
  const [mcpClients, setMcpClients] = useState<any[]>([])

  const generateCreds = async (assistant: 'claude' | 'chatgpt') => {
    setLoading(true)
    try {
      const creds = await api.registerMcpClient(assistant)
      setMcpCreds(creds)
    } catch { /* toast would go here */ }
    setLoading(false)
  }

  useEffect(() => {
    api.getMe().then(setUserInfo).catch(() => {})
    api.listApiKeys().then(setApiKeys).catch(() => {})
    api.listMcpClients().then(setMcpClients).catch(() => {})
  }, [])

  const createKey = async () => {
    if (!newLabel.trim()) return
    try {
      const key = await api.createApiKey(newLabel)
      setApiKeys(prev => [{
        id: key.id,
        label: key.label,
        created_at: key.created_at,
        last_used_at: null,
        revoked_at: null,
        key_preview: key.raw_key.slice(0, 5) + '••••' + key.raw_key.slice(-4),
      }, ...prev])
      setJustCreated(key.raw_key)
      setNewLabel('')
    } catch {}
  }

  const revokeKey = async (id: string) => {
    try {
      await api.revokeApiKey(id)
      setApiKeys(prev => prev.map(k => k.id === id ? { ...k, revoked_at: new Date().toISOString() } : k))
    } catch {}
  }

  const copyToClipboard = async (text: string, id: string) => {
    try {
      await navigator.clipboard.writeText(text)
    } catch {
      const el = document.createElement('textarea')
      el.value = text
      el.style.position = 'fixed'
      el.style.opacity = '0'
      document.body.appendChild(el)
      el.select()
      document.execCommand('copy')
      document.body.removeChild(el)
    }
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
            <p className="text-text-primary font-medium">{userInfo?.email || 'Loading...'}</p>
            <p className="text-text-muted text-sm">Signed in via Google</p>
          </div>
        </div>
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
            {apiKeys.map((key: any) => (
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

      {mcpClients.length > 0 && (
        <section className="border border-border-default rounded-[4px] p-4 bg-bg-surface space-y-3">
          <h2 className="text-sm font-mono text-text-muted uppercase tracking-wider">Connected Assistants</h2>
          <div className="space-y-2">
            {mcpClients.map(c => (
              <div key={c.client_id} className="flex items-center gap-3 px-3 py-2 border border-border-default rounded-[2px] bg-bg-surface">
                <Bot size={14} className="text-text-muted shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm text-text-primary font-medium">{c.client_name}</p>
                  <p className="text-xs font-mono text-text-muted truncate">{c.redirect_uri}</p>
                </div>
                <span className={`text-xs font-mono ${c.active ? 'text-state-success' : 'text-text-muted'}`}>
                  {c.active ? 'Active' : 'Inactive'}
                </span>
                <button
                  onClick={async () => {
                    await api.revokeMcpClient(c.client_id)
                    setMcpClients(prev => prev.filter(x => x.client_id !== c.client_id))
                  }}
                  className="p-1 border-none bg-transparent cursor-pointer text-text-muted hover:text-state-error"
                  title="Revoke access"
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="border border-border-default rounded-[4px] p-4 bg-bg-surface space-y-4">
        <h2 className="text-sm font-mono text-text-muted uppercase tracking-wider">AI Assistant Access</h2>
        <p className="text-sm text-text-muted">Generate credentials to connect Claude.ai or ChatGPT to your expenses via MCP.</p>
        <div className="flex gap-2">
          <button
            onClick={() => generateCreds('claude')}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-ink text-white text-sm rounded-[2px] border-none cursor-pointer hover:opacity-90 disabled:opacity-50"
          >
            <Bot size={14} /> {loading ? 'Generating...' : 'Claude.ai'}
          </button>
          <button
            onClick={() => generateCreds('chatgpt')}
            disabled={loading}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-accent-ink text-white text-sm rounded-[2px] border-none cursor-pointer hover:opacity-90 disabled:opacity-50"
          >
            <Bot size={14} /> {loading ? 'Generating...' : 'ChatGPT'}
          </button>
        </div>
      </section>

      {mcpCreds && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40" onClick={() => setMcpCreds(null)}>
          <div className="bg-bg-surface border border-border-default rounded-[4px] p-6 max-w-lg w-full mx-4 space-y-4 shadow-xl" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-heading text-text-primary">MCP Credentials — {mcpCreds.client_name}</h3>
            <p className="text-xs text-state-success font-mono uppercase tracking-wider">Copy these into your assistant's MCP settings</p>
            <div className="space-y-3">
              {([
                ['Authorization URL', mcpCreds.authorization_url],
                ['Token URL', mcpCreds.token_url],
                ['MCP Server URL', mcpCreds.mcp_url],
                ['Client ID', mcpCreds.client_id],
                ['Client Secret', mcpCreds.client_secret],
              ] as const).map(([label, value]) => (
                <div key={label}>
                  <label className="text-xs text-text-muted block mb-0.5">{label}</label>
                  <div className="flex items-center gap-2">
                    <code className="flex-1 px-2 py-1.5 text-xs bg-bg-hover rounded-[2px] font-mono break-all border border-border-default">{value}</code>
                    <button
                      onClick={() => copyToClipboard(value, `mcp-${label}`)}
                      className="flex items-center gap-1 px-2.5 py-1.5 text-xs border border-border-default rounded-[2px] bg-transparent cursor-pointer hover:bg-bg-hover text-text-muted whitespace-nowrap"
                    >
                      {copiedIndex === `mcp-${label}` ? <><Check size={12} className="text-state-success" /> Copied</> : <><Copy size={12} /> Copy</>}
                    </button>
                  </div>
                </div>
              ))}
            </div>
            <button
              onClick={() => setMcpCreds(null)}
              className="w-full py-2 mt-2 text-sm border border-border-default rounded-[2px] bg-transparent cursor-pointer hover:bg-bg-hover text-text-primary"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}