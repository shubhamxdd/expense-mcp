import type { Database } from 'sql.js'

export function createTables(db: Database) {
  db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS google_tokens (
      user_id TEXT PRIMARY KEY,
      refresh_token TEXT NOT NULL,
      access_token TEXT,
      expires_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS sheets (
      user_id TEXT PRIMARY KEY,
      spreadsheet_id TEXT NOT NULL,
      sheet_name TEXT NOT NULL DEFAULT 'Sheet1',
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS api_keys (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      key_hash TEXT NOT NULL,
      label TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      last_used_at TEXT,
      revoked_at TEXT,
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `)

  db.run(`
    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      name TEXT NOT NULL,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      UNIQUE(user_id, name),
      FOREIGN KEY (user_id) REFERENCES users(id)
    )
  `)
}

export type Row = Record<string, string | number | null>

export function queryAll(db: Database, sql: string, params: unknown[] = []): Row[] {
  const stmt = db.prepare(sql)
  stmt.bind(params)
  const rows: Row[] = []
  while (stmt.step()) {
    rows.push(stmt.getAsObject() as Row)
  }
  stmt.free()
  return rows
}

export function queryOne(db: Database, sql: string, params: unknown[] = []): Row | null {
  const rows = queryAll(db, sql, params)
  return rows[0] ?? null
}

export function execute(db: Database, sql: string, params: unknown[] = []) {
  db.run(sql, params)
}