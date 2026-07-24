const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:3001'

function getToken(): string | null {
  return localStorage.getItem('token')
}

export function setToken(token: string) {
  localStorage.setItem('token', token)
}

export function clearToken() {
  localStorage.removeItem('token')
}

export function isAuthenticated(): boolean {
  return !!getToken()
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const res = await fetch(`${API_BASE}${path}`, { ...options, headers })

  if (!res.ok) {
    const body = await res.json().catch(() => ({ error: { message: res.statusText } }))
    throw new Error(body.error?.message || `Request failed: ${res.status}`)
  }

  const body = await res.json()
  return body.data as T
}

export const api = {
  getMe: () => request<{ id: string; email: string }>('/api/me'),

  listExpenses: (params?: { from?: string; to?: string; tags?: string }) => {
    const search = new URLSearchParams()
    if (params?.from) search.set('from', params.from)
    if (params?.to) search.set('to', params.to)
    if (params?.tags) search.set('tags', params.tags)
    const qs = search.toString()
    return request<any[]>(`/api/expenses${qs ? `?${qs}` : ''}`)
  },

  createExpense: (data: { date: string; amount: number; tags: string[]; note: string }) =>
    request<any>('/api/expenses', { method: 'POST', body: JSON.stringify(data) }),

  updateExpense: (id: string, data: { date?: string; amount?: number; tags?: string[]; note?: string }) =>
    request<any>(`/api/expenses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteExpense: (id: string) =>
    request<{ success: boolean }>(`/api/expenses/${id}`, { method: 'DELETE' }),

  listTags: () => request<string[]>('/api/tags'),

  getSummary: (by: 'tag' | 'month', from?: string, to?: string) => {
    const search = new URLSearchParams({ by })
    if (from) search.set('from', from)
    if (to) search.set('to', to)
    return request<{ label: string; total: number }[]>(`/api/summary?${search.toString()}`)
  },

  listApiKeys: () =>
    request<{ id: string; label: string; created_at: string; last_used_at: string | null; revoked_at: string | null; key_preview: string }[]>('/api/apikeys'),

  createApiKey: (label: string) =>
    request<{ id: string; label: string; raw_key: string; created_at: string }>('/api/apikeys', {
      method: 'POST',
      body: JSON.stringify({ label }),
    }),

  revokeApiKey: (id: string) =>
    request<{ success: boolean }>(`/api/apikeys/${id}`, { method: 'DELETE' }),

  listMcpClients: () =>
    request<{ client_id: string; client_name: string; redirect_uri: string; created_at: string; active: boolean }[]>('/api/mcp/clients'),

  revokeMcpClient: (clientId: string) =>
    request<{ success: boolean }>(`/api/mcp/clients/${clientId}`, { method: 'DELETE' }),

  registerMcpClient: (assistant: 'claude' | 'chatgpt') =>
    request<{
      client_id: string
      client_secret: string
      client_name: string
      redirect_uri: string
      authorization_url: string
      token_url: string
      mcp_url: string
      scopes: string
    }>('/api/mcp/register', { method: 'POST', body: JSON.stringify({ assistant }) }),
}