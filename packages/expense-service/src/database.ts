import initSqlJs from 'sql.js'
import type { Database as SqlJsDatabase } from 'sql.js'
import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs'
import { join, dirname, resolve } from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)
const DB_PATH = process.env.DB_PATH || resolve(__dirname, '../../../apps/server/data/expense-tracker.db')

let db: SqlJsDatabase | null = null

export async function getDb(): Promise<SqlJsDatabase> {
  if (db) return db

  const SQL = await initSqlJs()
  const dir = dirname(DB_PATH)
  if (!existsSync(dir)) {
    mkdirSync(dir, { recursive: true })
  }

  if (existsSync(DB_PATH)) {
    const buffer = readFileSync(DB_PATH)
    db = new SQL.Database(buffer)
  } else {
    db = new SQL.Database()
  }

  return db
}

export function saveDb() {
  if (!db) return
  const data = db.export()
  const buffer = Buffer.from(data)
  writeFileSync(DB_PATH, buffer)
}

export function closeDb() {
  if (db) {
    saveDb()
    db.close()
    db = null
  }
}
