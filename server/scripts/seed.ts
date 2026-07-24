import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import initSqlJs from 'sql.js'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { dirname, join } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const DB_PATH = join(__dirname, '..', 'data', 'expense-tracker.db')
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production'

async function seed() {
  const dir = dirname(DB_PATH)
  if (!existsSync(dir)) mkdirSync(dir, { recursive: true })

  const SQL = await initSqlJs()
  let db: import('sql.js').Database

  if (existsSync(DB_PATH)) {
    const buffer = readFileSync(DB_PATH)
    db = new SQL.Database(buffer)
  } else {
    db = new SQL.Database()
  }

  db.run(`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')))`)
  db.run(`CREATE TABLE IF NOT EXISTS google_tokens (user_id TEXT PRIMARY KEY, refresh_token TEXT NOT NULL, access_token TEXT, expires_at TEXT, FOREIGN KEY (user_id) REFERENCES users(id))`)
  db.run(`CREATE TABLE IF NOT EXISTS sheets (user_id TEXT PRIMARY KEY, spreadsheet_id TEXT NOT NULL, sheet_name TEXT NOT NULL DEFAULT 'Sheet1', FOREIGN KEY (user_id) REFERENCES users(id))`)
  db.run(`CREATE TABLE IF NOT EXISTS api_keys (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, key_hash TEXT NOT NULL, label TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')), last_used_at TEXT, revoked_at TEXT, FOREIGN KEY (user_id) REFERENCES users(id))`)
  db.run(`CREATE TABLE IF NOT EXISTS tags (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, name TEXT NOT NULL, created_at TEXT NOT NULL DEFAULT (datetime('now')), UNIQUE(user_id, name), FOREIGN KEY (user_id) REFERENCES users(id))`)

  const userId = 'seed-user-001'
  const email = 'test@example.com'
  const name = 'Test User'

  db.run('INSERT OR IGNORE INTO users (id, email, name) VALUES (?, ?, ?)', [userId, email, name])

  db.run('INSERT OR IGNORE INTO google_tokens (user_id, refresh_token, access_token) VALUES (?, ?, ?)', [
    userId, 'mock-refresh-token', 'mock-access-token',
  ])

  db.run('INSERT OR IGNORE INTO sheets (user_id, spreadsheet_id) VALUES (?, ?)', [
    userId, 'mock-spreadsheet-id',
  ])

  const apiKey = `exp_test_${crypto.randomBytes(16).toString('hex')}`
  const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex')
  db.run('INSERT OR IGNORE INTO api_keys (id, user_id, key_hash, label) VALUES (?, ?, ?, ?)', [
    crypto.randomUUID(), userId, keyHash, 'Test CLI Key',
  ])

  const tags = ['food', 'coffee', 'rent', 'groceries', 'fuel', 'lunch', 'dinner', 'electronics']
  for (const tag of tags) {
    db.run('INSERT OR IGNORE INTO tags (id, user_id, name) VALUES (?, ?, ?)', [crypto.randomUUID(), userId, tag])
  }

  const token = jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '30d' })

  const data = db.export()
  writeFileSync(DB_PATH, Buffer.from(data))
  db.close()

  console.log('\n══════════════════════════════════════════')
  console.log('  Seed complete — test user created')
  console.log('══════════════════════════════════════════')
  console.log()
  console.log('  JWT Token (for frontend auth):')
  console.log(`  ${token}`)
  console.log()
  console.log('  API Key (for MCP server):')
  console.log(`  ${apiKey}`)
  console.log()
  console.log('  Run the backend:')
  console.log('  cd server && npm run dev')
  console.log()
  console.log('  Run the frontend:')
  console.log('  cd client && VITE_API_URL=http://localhost:3001 npm run dev')
  console.log()
  console.log('  Then open:')
  console.log(`  http://localhost:5173/?token=${token}`)
  console.log()
  console.log('  For MCP server:')
  console.log('  cd mcp && EXPENSE_API_KEY=<api-key> npm run dev')
  console.log('══════════════════════════════════════════\n')
}

seed().catch(console.error)