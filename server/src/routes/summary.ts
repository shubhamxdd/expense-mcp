import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()
router.use(authMiddleware)

router.get('/', async (req, res) => {
  try {
    const by = req.query.by as string
    const from = req.query.from as string | undefined
    const to = req.query.to as string | undefined

    if (by !== 'tag' && by !== 'month') {
      res.status(400).json({ error: { message: 'Query param "by" must be "tag" or "month"', code: 'VALIDATION_ERROR' } })
      return
    }

    const { getSummary } = await import('../services/expenseService.js')
    const summary = await getSummary(req.user!.userId, by as 'tag' | 'month', from, to)
    res.json({ data: summary })
  } catch (err) {
    console.error('Error getting summary:', err)
    res.status(500).json({ error: { message: 'Failed to get summary', code: 'INTERNAL_ERROR' } })
  }
})

export default router