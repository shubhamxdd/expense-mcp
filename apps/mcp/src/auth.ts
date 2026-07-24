import { createHash } from 'crypto'
import initSqlJs from 'sql.js'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DB_PATH = join(__dirname, '..', '..', 'server', 'data', 'expense-tracker.db')

export async function validateApiKey(key: string): Promise<string> {
  const dir = join(__dirname, '..', '..', 'server', 'data')
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })

  const SQL = await initSqlJs()

  let db: import('sql.js').Database
  if (existsSync(DB_PATH)) {
    const buffer = readFileSync(DB_PATH)
    db = new SQL.Database(buffer)
  } else {
    throw new Error('Database not found. Run the server first to create the database.')
  }

  const hash = createHash('sha256').update(key).digest('hex')
  const stmt = db.prepare('SELECT user_id FROM api_keys WHERE key_hash = ? AND revoked_at IS NULL')
  stmt.bind([hash])

  let userId: string | null = null
  if (stmt.step()) {
    const row = stmt.getAsObject() as { user_id: string }
    userId = row.user_id
  }
  stmt.free()
  db.close()

  if (!userId) throw new Error('Invalid or revoked API key')
  return userId
}

export function hashKey(key: string): string {
  return createHash('sha256').update(key).digest('hex')
}