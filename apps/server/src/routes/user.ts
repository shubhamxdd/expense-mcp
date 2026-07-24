import { Router } from 'express'
import { authMiddleware } from '../middleware/auth.js'

const router = Router()

router.get('/me', authMiddleware, (req, res) => {
  res.json({ data: { id: req.user!.userId, email: req.user!.email } })
})

export default router