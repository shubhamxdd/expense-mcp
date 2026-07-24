import { Router } from 'express'
import { z } from 'zod'
import { authMiddleware } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'
import { getDb, saveDb } from '../db/database.js'
import { createTables, queryAll, queryOne, execute } from '../db/schema.js'
import crypto from 'crypto'

const router = Router()
router.use(authMiddleware)

const createKeySchema = z.object({
  label: z.string().min(1).max(100),
})

function hashKey(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex')
}

function generateRawKey(): string {
  return `exp_${crypto.randomBytes(24).toString('hex')}`
}

router.get('/', async (req, res) => {
  try {
    const db = await getDb()
    await createTables(db)
    const rows = queryAll(
      db,
      `SELECT id, label, created_at, last_used_at, revoked_at,
              SUBSTR('exp_' || '••••' || SUBSTR(key_hash, 1, 4), 1, 12) AS key_preview
       FROM api_keys
       WHERE user_id = ?
       ORDER BY created_at DESC`,
      [req.user!.userId]
    )
    res.json({ data: rows })
  } catch (err) {
    console.error('Error listing API keys:', err)
    res.status(500).json({ error: { message: 'Failed to list API keys', code: 'INTERNAL_ERROR' } })
  }
})

router.post('/', validate(createKeySchema), async (req, res) => {
  try {
    const db = await getDb()
    await createTables(db)
    const id = crypto.randomUUID()
    const rawKey = generateRawKey()
    const keyHash = hashKey(rawKey)
    execute(db, 'INSERT INTO api_keys (id, user_id, key_hash, label) VALUES (?, ?, ?, ?)', [
      id, req.user!.userId, keyHash, req.body.label,
    ])
    saveDb()
    res.status(201).json({ data: { id, label: req.body.label, raw_key: rawKey, created_at: new Date().toISOString() } })
  } catch (err) {
    console.error('Error creating API key:', err)
    res.status(500).json({ error: { message: 'Failed to create API key', code: 'INTERNAL_ERROR' } })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const db = await getDb()
    await createTables(db)
    const existing = queryOne(db, 'SELECT id FROM api_keys WHERE id = ? AND user_id = ? AND revoked_at IS NULL', [
      req.params.id as string, req.user!.userId,
    ])
    if (!existing) {
      res.status(404).json({ error: { message: 'API key not found or already revoked', code: 'NOT_FOUND' } })
      return
    }
    execute(db, 'UPDATE api_keys SET revoked_at = datetime("now") WHERE id = ?', [req.params.id as string])
    saveDb()
    res.json({ data: { success: true } })
  } catch (err) {
    console.error('Error revoking API key:', err)
    res.status(500).json({ error: { message: 'Failed to revoke API key', code: 'INTERNAL_ERROR' } })
  }
})

export default router