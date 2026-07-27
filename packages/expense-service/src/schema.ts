import type pg from 'pg'

export type Row = Record<string, unknown>

function sqlParams(sql: string, params: unknown[]): { text: string; values: unknown[] } {
  let idx = 0
  const text = sql.replace(/\?/g, () => `$${++idx}`)
  return { text, values: params }
}

export async function queryAll(db: pg.Pool, sql: string, params: unknown[] = []): Promise<Row[]> {
  const { text, values } = sqlParams(sql, params)
  const result = await db.query(text, values)
  return result.rows
}

export async function queryOne(db: pg.Pool, sql: string, params: unknown[] = []): Promise<Row | null> {
  const rows = await queryAll(db, sql, params)
  return rows[0] ?? null
}

export async function execute(db: pg.Pool, sql: string, params: unknown[] = []) {
  const { text, values } = sqlParams(sql, params)
  await db.query(text, values)
}

export async function createTables(db: pg.Pool) {
  await db.query(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT NOT NULL UNIQUE,
      name TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
  await db.query(`
    CREATE TABLE IF NOT EXISTS google_tokens (
      user_id TEXT PRIMARY KEY REFERENCES users(id),
      refresh_token TEXT NOT NULL,
      access_token TEXT,
      expires_at TEXT
    )
  `)
  await db.query(`
    CREATE TABLE IF NOT EXISTS sheets (
      user_id TEXT PRIMARY KEY REFERENCES users(id),
      spreadsheet_id TEXT NOT NULL,
      sheet_name TEXT NOT NULL DEFAULT 'Sheet1'
    )
  `)
  await db.query(`
    CREATE TABLE IF NOT EXISTS api_keys (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      key_hash TEXT NOT NULL,
      label TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      last_used_at TIMESTAMPTZ,
      revoked_at TIMESTAMPTZ
    )
  `)
  await db.query(`
    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL REFERENCES users(id),
      name TEXT NOT NULL,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
      UNIQUE(user_id, name)
    )
  `)
  await db.query(`
    CREATE TABLE IF NOT EXISTS oauth_clients (
      client_id TEXT PRIMARY KEY,
      client_secret TEXT,
      redirect_uris TEXT NOT NULL,
      grant_types TEXT NOT NULL DEFAULT '["authorization_code","refresh_token"]',
      response_types TEXT NOT NULL DEFAULT '["code"]',
      client_name TEXT,
      scope TEXT DEFAULT '',
      client_id_issued_at INTEGER,
      client_secret_expires_at INTEGER,
      created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    )
  `)
  await db.query(`
    CREATE TABLE IF NOT EXISTS oauth_auth_codes (
      code TEXT PRIMARY KEY,
      client_id TEXT NOT NULL REFERENCES oauth_clients(client_id),
      user_id TEXT NOT NULL,
      scope TEXT,
      code_challenge TEXT NOT NULL,
      code_challenge_method TEXT NOT NULL DEFAULT 'S256',
      redirect_uri TEXT NOT NULL,
      resource TEXT,
      expires_at TIMESTAMPTZ NOT NULL,
      used INTEGER NOT NULL DEFAULT 0
    )
  `)
  await db.query(`
    CREATE TABLE IF NOT EXISTS oauth_tokens (
      id TEXT PRIMARY KEY,
      access_token_hash TEXT NOT NULL,
      refresh_token_hash TEXT,
      client_id TEXT NOT NULL REFERENCES oauth_clients(client_id),
      user_id TEXT NOT NULL,
      scope TEXT DEFAULT '',
      expires_at TIMESTAMPTZ NOT NULL,
      refresh_expires_at TIMESTAMPTZ,
      revoked_at TIMESTAMPTZ
    )
  `)
}
