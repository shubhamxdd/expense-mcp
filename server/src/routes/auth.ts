import { Router } from 'express'
import { z } from 'zod'
import { getDb, saveDb } from '../db/database.js'
import { createTables, queryOne, execute } from '../db/schema.js'
import { getAuthUrl, getTokensFromCode, getUserInfo, createSpreadsheet } from '../services/oauth.js'
import { generateToken } from '../middleware/auth.js'

const router = Router()

router.get('/google', (_req, res) => {
  res.redirect(getAuthUrl())
})

router.get('/google/callback', async (req, res) => {
  try {
    const code = req.query.code as string
    if (!code) {
      res.status(400).json({ error: { message: 'Missing authorization code', code: 'MISSING_CODE' } })
      return
    }

    const tokens = await getTokensFromCode(code)
    if (!tokens.access_token) {
      res.status(400).json({ error: { message: 'Failed to get access token', code: 'TOKEN_ERROR' } })
      return
    }

    const userInfo = await getUserInfo(tokens.access_token)
    const email = userInfo.email!
    const name = userInfo.name || email.split('@')[0]

    const db = await getDb()
    await createTables(db)

    const existing = queryOne(db, 'SELECT id FROM users WHERE email = ?', [email])
    let userId: string

    if (existing) {
      userId = existing.id as string
      execute(db, 'UPDATE google_tokens SET refresh_token = ?, access_token = ?, expires_at = ? WHERE user_id = ?', [
        tokens.refresh_token || '',
        tokens.access_token || '',
        tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : '',
        userId,
      ])
    } else {
      userId = crypto.randomUUID()
      execute(db, 'INSERT INTO users (id, email, name) VALUES (?, ?, ?)', [userId, email, name])
      execute(db, 'INSERT INTO google_tokens (user_id, refresh_token, access_token, expires_at) VALUES (?, ?, ?, ?)', [
        userId,
        tokens.refresh_token || '',
        tokens.access_token || '',
        tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : '',
      ])

      const spreadsheetId = await createSpreadsheet(tokens.access_token, name)
      execute(db, 'INSERT INTO sheets (user_id, spreadsheet_id) VALUES (?, ?)', [userId, spreadsheetId])
    }

    saveDb()

    const jwt = generateToken({ userId, email })
    res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}?token=${jwt}`)
  } catch (err) {
    console.error('OAuth callback error:', err)
    res.status(500).json({ error: { message: 'Authentication failed', code: 'AUTH_ERROR' } })
  }
})

export default router