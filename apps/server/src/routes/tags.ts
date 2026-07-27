import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'
import { getDb, createTables, queryAll } from '@expense/expense-service'

const router = Router()
router.use(authMiddleware)

router.get('/', async (req, res) => {
  try {
    const db = await getDb()
    await createTables(db)
    const rows = await queryAll(db, 'SELECT DISTINCT name FROM tags WHERE user_id = ? ORDER BY name', [req.user!.userId])
    const tags = rows.map(r => r.name as string)
    res.json({ data: tags })
  } catch (err) {
    console.error('Error listing tags:', err)
    res.status(500).json({ error: { message: 'Failed to list tags', code: 'INTERNAL_ERROR' } })
  }
})

export default router