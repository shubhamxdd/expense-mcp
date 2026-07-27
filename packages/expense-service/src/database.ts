import pg from 'pg'

const { Pool } = pg

let pool: pg.Pool | null = null

const DATABASE_URL = process.env.DATABASE_URL || 'postgres://postgres:postgres@localhost:5432/expense_tracker'

export async function getDb(): Promise<pg.Pool> {
  if (pool) return pool
  pool = new Pool({ connectionString: DATABASE_URL })
  await pool.query('SELECT 1')
  return pool
}

export async function closeDb() {
  if (pool) {
    await pool.end()
    pool = null
  }
}
