import { API_URL } from '../utils/env'
import { getToken } from './auth'

export class ApiError extends Error {
  constructor(message: string, public status: number, public code?: string) {
    super(message)
    this.name = 'ApiError'
  }
}

async function request<T>(path: string, options: RequestInit = {}): Promise<T> {
  const token = await getToken()
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  }
  if (token) headers['Authorization'] = `Bearer ${token}`

  const response = await fetch(`${API_URL}${path}`, { ...options, headers })

  if (!response.ok) {
    let body: any
    try { body = await response.json() } catch { body = {} }
    throw new ApiError(
      body.error?.message || `Request failed: ${response.status}`,
      response.status,
      body.error?.code,
    )
  }

  const body = await response.json()
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
    return request<ExpenseResponse[]>(`/api/expenses${qs ? `?${qs}` : ''}`)
  },

  createExpense: (data: { date: string; amount: number; tags: string[]; note: string }) =>
    request<ExpenseResponse>('/api/expenses', { method: 'POST', body: JSON.stringify(data) }),

  updateExpense: (id: string, data: { date?: string; amount?: number; tags?: string[]; note?: string }) =>
    request<ExpenseResponse>(`/api/expenses/${id}`, { method: 'PUT', body: JSON.stringify(data) }),

  deleteExpense: (id: string) =>
    request<{ success: boolean }>(`/api/expenses/${id}`, { method: 'DELETE' }),

  listTags: () => request<string[]>('/api/tags'),

  getSummary: (by: 'tag' | 'month', from?: string, to?: string) => {
    const search = new URLSearchParams({ by })
    if (from) search.set('from', from)
    if (to) search.set('to', to)
    return request<SummaryItem[]>(`/api/summary?${search.toString()}`)
  },

  listApiKeys: () =>
    request<ApiKeyResponse[]>('/api/apikeys'),

  createApiKey: (label: string) =>
    request<{ id: string; label: string; raw_key: string; created_at: string }>('/api/apikeys', {
      method: 'POST',
      body: JSON.stringify({ label }),
    }),

  revokeApiKey: (id: string) =>
    request<{ success: boolean }>(`/api/apikeys/${id}`, { method: 'DELETE' }),

  listMcpClients: () =>
    request<McpClientResponse[]>('/api/mcp/clients'),

  revokeMcpClient: (clientId: string) =>
    request<{ success: boolean }>(`/api/mcp/clients/${clientId}`, { method: 'DELETE' }),

  registerMcpClient: (assistant: 'claude' | 'chatgpt') =>
    request<McpCredentialsResponse>('/api/mcp/register', {
      method: 'POST',
      body: JSON.stringify({ assistant }),
    }),
}

export interface ExpenseResponse {
  id: string
  date: string
  amount: number
  tags: string[]
  note: string
  created_at: string
}

export interface SummaryItem {
  label: string
  total: number
}

export interface ApiKeyResponse {
  id: string
  label: string
  created_at: string
  last_used_at: string | null
  revoked_at: string | null
  key_preview: string
}

export interface McpClientResponse {
  client_id: string
  client_name: string
  redirect_uri: string
  created_at: string
  active: boolean
}

export interface McpCredentialsResponse {
  client_id: string
  client_secret: string
  client_name: string
  redirect_uri: string
  authorization_url: string
  token_url: string
  mcp_url: string
  scopes: string
}
