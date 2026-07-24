import type { Expense } from '../types/expense'

const now = new Date()
const today = now.toISOString().slice(0, 10)
const daysAgo = (n: number) => new Date(now.getTime() - n * 86400000).toISOString().slice(0, 10)

export const mockExpenses: Expense[] = [
  { id: '1', date: today, amount: 450, tags: ['lunch', 'food'], note: 'Biryani at Paradise', created_at: new Date().toISOString() },
  { id: '2', date: today, amount: 200, tags: ['coffee'], note: 'Cold brew', created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: '3', date: daysAgo(1), amount: 15000, tags: ['rent'], note: 'June rent', created_at: new Date(Date.now() - 86400000).toISOString() },
  { id: '4', date: daysAgo(2), amount: 3200, tags: ['groceries'], note: 'Weekly groceries', created_at: new Date(Date.now() - 172800000).toISOString() },
  { id: '5', date: daysAgo(3), amount: 850, tags: ['fuel'], note: 'Petrol', created_at: new Date(Date.now() - 259200000).toISOString() },
  { id: '6', date: daysAgo(5), amount: 1200, tags: ['dinner', 'food'], note: 'Dinner at Social', created_at: new Date(Date.now() - 432000000).toISOString() },
  { id: '7', date: daysAgo(7), amount: 500, tags: ['coffee'], note: '', created_at: new Date(Date.now() - 604800000).toISOString() },
  { id: '8', date: daysAgo(10), amount: 2500, tags: ['groceries', 'food'], note: 'Fruits and veggies', created_at: new Date(Date.now() - 864000000).toISOString() },
  { id: '9', date: daysAgo(14), amount: 6000, tags: ['electronics'], note: 'Wireless keyboard', created_at: new Date(Date.now() - 1209600000).toISOString() },
  { id: '10', date: daysAgo(20), amount: 350, tags: ['lunch'], note: 'Pizza slice', created_at: new Date(Date.now() - 1728000000).toISOString() },
]

export const mockTags = [...new Set(mockExpenses.flatMap(e => e.tags))].sort()

export function generateId(): string {
  return crypto.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`
}

const delay = (ms: number) => new Promise(r => setTimeout(r, ms))

export async function fetchMockExpenses(filters?: { from?: string; to?: string; tags?: string[] }): Promise<Expense[]> {
  await delay(200)
  let filtered = [...mockExpenses]
  if (filters?.from) filtered = filtered.filter(e => e.date >= filters.from!)
  if (filters?.to) filtered = filtered.filter(e => e.date <= filters.to!)
  if (filters?.tags?.length) filtered = filtered.filter(e => filters.tags!.some(t => e.tags.includes(t)))
  return filtered.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
}

export async function addMockExpense(expense: Omit<Expense, 'id' | 'created_at'>): Promise<Expense> {
  await delay(150)
  const newExpense: Expense = { ...expense, id: generateId(), created_at: new Date().toISOString() }
  mockExpenses.unshift(newExpense)
  return newExpense
}

export async function deleteMockExpense(id: string): Promise<void> {
  await delay(100)
  const idx = mockExpenses.findIndex(e => e.id === id)
  if (idx !== -1) mockExpenses.splice(idx, 1)
}

export async function updateMockExpense(id: string, updates: Partial<Expense>): Promise<Expense> {
  await delay(150)
  const idx = mockExpenses.findIndex(e => e.id === id)
  if (idx === -1) throw new Error('Expense not found')
  mockExpenses[idx] = { ...mockExpenses[idx], ...updates }
  return mockExpenses[idx]
}

export async function fetchMockTags(): Promise<string[]> {
  await delay(100)
  return [...mockTags]
}

export async function fetchMockSummary(by: 'tag' | 'month', from?: string, to?: string): Promise<{ label: string; total: number }[]> {
  await delay(200)
  const expenses = await fetchMockExpenses({ from, to })
  if (by === 'tag') {
    const map = new Map<string, number>()
    expenses.forEach(e => e.tags.forEach(t => map.set(t, (map.get(t) || 0) + e.amount)))
    return Array.from(map.entries()).map(([label, total]) => ({ label, total })).sort((a, b) => b.total - a.total)
  }
  const map = new Map<string, number>()
  expenses.forEach(e => {
    const month = e.date.slice(0, 7)
    map.set(month, (map.get(month) || 0) + e.amount)
  })
  return Array.from(map.entries()).map(([label, total]) => ({ label, total })).sort((a, b) => a.label.localeCompare(b.label))
}

export const mockUser = { id: 'u1', email: 'user@gmail.com', name: 'Ravi Sharma' }

export const mockApiKeys: { id: string; label: string; created_at: string; last_used_at: string | null; revoked_at: string | null; key_preview: string }[] = [
  { id: 'k1', label: 'Claude Desktop', created_at: new Date(Date.now() - 86400000 * 30).toISOString(), last_used_at: new Date(Date.now() - 86400000 * 2).toISOString(), revoked_at: null, key_preview: 'exp_••••a3f8' },
  { id: 'k2', label: 'ChatGPT', created_at: new Date(Date.now() - 86400000 * 10).toISOString(), last_used_at: null, revoked_at: null, key_preview: 'exp_••••b7c2' },
]