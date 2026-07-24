import { google } from 'googleapis'
import type { sheets_v4 } from 'googleapis'
import { getDb } from '../db/database.js'
import { createTables, queryOne, execute } from '../db/schema.js'
import { saveDb } from '../db/database.js'

export interface Expense {
  id: string
  date: string
  amount: number
  tags: string[]
  note: string
  created_at: string
}

interface ListOptions {
  from?: string
  to?: string
  tags?: string[]
}

let sheetsClient: sheets_v4.Sheets | null = null
let currentUserId: string | null = null
let currentSheetId: string | null = null
let currentSheetName: string | null = null

async function getSheetsClient(userId: string) {
  if (sheetsClient && currentUserId === userId) return sheetsClient

  const db = await getDb()
  await createTables(db)

  const tokenRow = queryOne(db, 'SELECT refresh_token FROM google_tokens WHERE user_id = ?', [userId])
  if (!tokenRow) throw new Error('NO_TOKENS')

  const refreshToken = tokenRow.refresh_token as string
  const oauth2 = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET
  )
  oauth2.setCredentials({ refresh_token: refreshToken })

  const sheetRow = queryOne(db, 'SELECT spreadsheet_id, sheet_name FROM sheets WHERE user_id = ?', [userId])
  if (!sheetRow) throw new Error('NO_SHEET')

  currentSheetId = sheetRow.spreadsheet_id as string
  currentSheetName = (sheetRow.sheet_name as string) || 'Sheet1'

  sheetsClient = google.sheets({ version: 'v4', auth: oauth2 })
  currentUserId = userId
  return sheetsClient
}

function getSheetId(): string {
  return currentSheetId!
}

function getSheetName(): string {
  return currentSheetName!
}

function parseExpenseRow(row: string[]): Expense | null {
  if (row[6] && row[6].trim()) return null
  return {
    id: row[0],
    date: row[1],
    amount: parseFloat(row[2]) || 0,
    tags: row[3] ? row[3].split(',').map(t => t.trim()).filter(Boolean) : [],
    note: row[4] || '',
    created_at: row[5],
  }
}

const cache = new Map<string, { data: Expense[]; expiry: number }>()

function getCached(userId: string): Expense[] | null {
  const entry = cache.get(userId)
  if (entry && entry.expiry > Date.now()) return entry.data
  cache.delete(userId)
  return null
}

function setCache(userId: string, data: Expense[]) {
  cache.set(userId, { data, expiry: Date.now() + 30000 })
}

function clearCache(userId: string) {
  cache.delete(userId)
}

async function fetchAllExpenses(userId: string): Promise<Expense[]> {
  const cached = getCached(userId)
  if (cached) return cached

  const sheets = await getSheetsClient(userId)
  const sheetId = getSheetId()
  const sheetName = getSheetName()

  const { data } = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${sheetName}!A:G`,
  })

  const rows = data.values || []
  if (rows.length <= 1) return []

  const expenses: Expense[] = []
  for (let i = 1; i < rows.length; i++) {
    const expense = parseExpenseRow(rows[i] as string[])
    if (expense) expenses.push(expense)
  }

  setCache(userId, expenses)
  return expenses
}

export async function listExpenses(userId: string, options: ListOptions = {}): Promise<Expense[]> {
  let expenses = await fetchAllExpenses(userId)

  if (options.from) expenses = expenses.filter(e => e.date >= options.from!)
  if (options.to) expenses = expenses.filter(e => e.date <= options.to!)
  if (options.tags && options.tags.length > 0) {
    expenses = expenses.filter(e => options.tags!.some(t => e.tags.includes(t)))
  }

  expenses.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
  return expenses
}

export async function addExpense(
  userId: string,
  expense: { date: string; amount: number; tags: string[]; note: string }
): Promise<Expense> {
  const sheets = await getSheetsClient(userId)
  const sheetId = getSheetId()
  const sheetName = getSheetName()

  const newExpense: Expense = {
    id: crypto.randomUUID(),
    date: expense.date,
    amount: expense.amount,
    tags: expense.tags,
    note: expense.note,
    created_at: new Date().toISOString(),
  }

  await sheets.spreadsheets.values.append({
    spreadsheetId: sheetId,
    range: `${sheetName}!A:G`,
    valueInputOption: 'RAW',
    insertDataOption: 'INSERT_ROWS',
    requestBody: {
      values: [[
        newExpense.id,
        newExpense.date,
        newExpense.amount,
        newExpense.tags.join(','),
        newExpense.note,
        newExpense.created_at,
        '',
      ]],
    },
  })

  clearCache(userId)

  const db = await getDb()
  await createTables(db)
  for (const tag of expense.tags) {
    const existing = queryOne(db, 'SELECT id FROM tags WHERE user_id = ? AND name = ?', [userId, tag])
    if (!existing) {
      execute(db, 'INSERT INTO tags (id, user_id, name) VALUES (?, ?, ?)', [crypto.randomUUID(), userId, tag])
    }
  }
  saveDb()

  return newExpense
}

export async function updateExpense(
  userId: string,
  expenseId: string,
  updates: { date?: string; amount?: number; tags?: string[]; note?: string }
): Promise<Expense> {
  const sheets = await getSheetsClient(userId)
  const sheetId = getSheetId()
  const sheetName = getSheetName()

  const { data } = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${sheetName}!A:G`,
  })

  const rows = data.values || []
  let rowIndex = -1
  for (let i = 1; i < rows.length; i++) {
    if ((rows[i] as string[])[0] === expenseId && !((rows[i] as string[])[6] || '').trim()) {
      rowIndex = i
      break
    }
  }

  if (rowIndex === -1) throw new Error('NOT_FOUND')

  const existing = rows[rowIndex] as string[]
  const updated: string[] = [
    expenseId,
    updates.date || existing[1],
    updates.amount?.toString() || existing[2],
    updates.tags ? updates.tags.join(',') : existing[3],
    updates.note ?? existing[4],
    existing[5],
    existing[6] || '',
  ]

  await sheets.spreadsheets.values.update({
    spreadsheetId: sheetId,
    range: `${sheetName}!A${rowIndex + 1}:G${rowIndex + 1}`,
    valueInputOption: 'RAW',
    requestBody: { values: [updated] },
  })

  clearCache(userId)
  return parseExpenseRow(updated)!
}

export async function deleteExpense(userId: string, expenseId: string): Promise<void> {
  const sheets = await getSheetsClient(userId)
  const sheetId = getSheetId()
  const sheetName = getSheetName()

  const { data } = await sheets.spreadsheets.values.get({
    spreadsheetId: sheetId,
    range: `${sheetName}!A:G`,
  })

  const rows = data.values || []
  for (let i = 1; i < rows.length; i++) {
    if ((rows[i] as string[])[0] === expenseId) {
      const deletedAt = new Date().toISOString()
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: `${sheetName}!G${i + 1}`,
        valueInputOption: 'RAW',
        requestBody: { values: [[deletedAt]] },
      })
      clearCache(userId)
      return
    }
  }

  throw new Error('NOT_FOUND')
}

export async function getSummary(
  userId: string,
  by: 'tag' | 'month',
  from?: string,
  to?: string
): Promise<{ label: string; total: number }[]> {
  const expenses = await listExpenses(userId, { from, to })

  if (by === 'tag') {
    const map = new Map<string, number>()
    expenses.forEach(e => e.tags.forEach(t => map.set(t, (map.get(t) || 0) + e.amount)))
    return Array.from(map.entries())
      .map(([label, total]) => ({ label, total }))
      .sort((a, b) => b.total - a.total)
  }

  const map = new Map<string, number>()
  expenses.forEach(e => {
    const month = e.date.slice(0, 7)
    map.set(month, (map.get(month) || 0) + e.amount)
  })
  return Array.from(map.entries())
    .map(([label, total]) => ({ label, total }))
    .sort((a, b) => a.label.localeCompare(b.label))
}