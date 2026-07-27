import crypto from 'crypto'
import jwt from 'jsonwebtoken'
import pg from 'pg'

const { Pool } = pg

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/expense_tracker'
const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production'

async function seed() {
  const pool = new Pool({ connectionString: DATABASE_URL })
  await pool.query('SELECT 1')

  await pool.query(`CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, name TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW())`)
  await pool.query(`CREATE TABLE IF NOT EXISTS google_tokens (user_id TEXT PRIMARY KEY REFERENCES users(id), refresh_token TEXT NOT NULL, access_token TEXT, expires_at TEXT)`)
  await pool.query(`CREATE TABLE IF NOT EXISTS sheets (user_id TEXT PRIMARY KEY REFERENCES users(id), spreadsheet_id TEXT NOT NULL, sheet_name TEXT NOT NULL DEFAULT 'Sheet1')`)
  await pool.query(`CREATE TABLE IF NOT EXISTS api_keys (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), key_hash TEXT NOT NULL, label TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), last_used_at TIMESTAMPTZ, revoked_at TIMESTAMPTZ)`)
  await pool.query(`CREATE TABLE IF NOT EXISTS tags (id TEXT PRIMARY KEY, user_id TEXT NOT NULL REFERENCES users(id), name TEXT NOT NULL, created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(), UNIQUE(user_id, name))`)

  const userId = 'seed-user-001'
  const email = 'test@example.com'
  const name = 'Test User'

  await pool.query('INSERT INTO users (id, email, name) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING', [userId, email, name])
  await pool.query('INSERT INTO google_tokens (user_id, refresh_token, access_token) VALUES ($1, $2, $3) ON CONFLICT (user_id) DO NOTHING', [
    userId, 'mock-refresh-token', 'mock-access-token',
  ])
  await pool.query('INSERT INTO sheets (user_id, spreadsheet_id) VALUES ($1, $2) ON CONFLICT (user_id) DO NOTHING', [
    userId, 'mock-spreadsheet-id',
  ])

  const apiKey = `exp_test_${crypto.randomBytes(16).toString('hex')}`
  const keyHash = crypto.createHash('sha256').update(apiKey).digest('hex')
  await pool.query('INSERT INTO api_keys (id, user_id, key_hash, label) VALUES ($1, $2, $3, $4) ON CONFLICT (id) DO NOTHING', [
    crypto.randomUUID(), userId, keyHash, 'Test CLI Key',
  ])

  const tags = ['food', 'coffee', 'rent', 'groceries', 'fuel', 'lunch', 'dinner', 'electronics']
  for (const tag of tags) {
    await pool.query('INSERT INTO tags (id, user_id, name) VALUES ($1, $2, $3) ON CONFLICT (user_id, name) DO NOTHING', [crypto.randomUUID(), userId, tag])
  }

  const token = jwt.sign({ userId, email }, JWT_SECRET, { expiresIn: '30d' })

  await pool.end()

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
  console.log('  Start infrastructure:')
  console.log('  docker compose up -d')
  console.log()
  console.log('  Then open:')
  console.log(`  http://localhost:3001/?token=${token}`)
  console.log()
  console.log('══════════════════════════════════════════\n')
}

seed().catch(console.error)
