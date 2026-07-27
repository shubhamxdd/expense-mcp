import { Router } from 'express'
import { z } from 'zod'
import { getDb, createTables, queryOne, execute } from '@expense/expense-service'
import { getAuthUrl, getTokensFromCode, getUserInfo, createSpreadsheet } from '../services/oauth.js'
import { generateToken } from '../middleware/auth.js'

const router = Router()

router.get('/google', (req, res) => {
  const redirectUri = req.query.redirect_uri as string | undefined
  const state = redirectUri
    ? Buffer.from(JSON.stringify({ redirect_uri: redirectUri, parent_state: req.query.state || '' })).toString('base64url')
    : (req.query.state as string || undefined)
  res.redirect(getAuthUrl(state))
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

    const existing = await queryOne(db, 'SELECT id FROM users WHERE email = ?', [email])
    let userId: string

    if (existing) {
      userId = existing.id as string
      await execute(db, 'UPDATE google_tokens SET refresh_token = ?, access_token = ?, expires_at = ? WHERE user_id = ?', [
        tokens.refresh_token || '',
        tokens.access_token || '',
        tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : '',
        userId,
      ])
    } else {
      userId = crypto.randomUUID()
      await execute(db, 'INSERT INTO users (id, email, name) VALUES (?, ?, ?)', [userId, email, name])
      await execute(db, 'INSERT INTO google_tokens (user_id, refresh_token, access_token, expires_at) VALUES (?, ?, ?, ?)', [
        userId,
        tokens.refresh_token || '',
        tokens.access_token || '',
        tokens.expiry_date ? new Date(tokens.expiry_date).toISOString() : '',
      ])

      const spreadsheetId = await createSpreadsheet(tokens.access_token, name)
      await execute(db, 'INSERT INTO sheets (user_id, spreadsheet_id) VALUES (?, ?)', [userId, spreadsheetId])
    }

    const jwt = generateToken({ userId, email })

    // Set JWT cookie for auto-auth on future MCP authorize visits
    res.cookie('mcp_token', jwt, { httpOnly: true, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 })

    // Check if this callback originated from the MCP authorize page
    const stateParam = req.query.state as string | undefined
    let mcpState: Record<string, string> | null = null
    if (stateParam) {
      try {
        mcpState = JSON.parse(Buffer.from(stateParam, 'base64url').toString())
      } catch { /* not an MCP state */ }
    }

    if (mcpState && mcpState.mcp_authorize === '1') {
      // Complete the MCP OAuth authorize flow
      const authCode = crypto.randomUUID().replace(/-/g, '')
      await execute(db, `INSERT INTO oauth_auth_codes (code, client_id, user_id, scope, code_challenge, code_challenge_method, redirect_uri, resource, expires_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW() + INTERVAL '10 minutes')`,
        [authCode, mcpState.client_id, userId, mcpState.scope || '', mcpState.code_challenge, 'S256', mcpState.redirect_uri, null])

      const url = new URL(mcpState.redirect_uri)
      url.searchParams.set('code', authCode)
      url.searchParams.set('state', mcpState.oauth_state || '')
      res.redirect(302, url.toString())
    } else if (mcpState && mcpState.redirect_uri) {
      // Mobile app auth — redirect to custom scheme
      const url = new URL(mcpState.redirect_uri)
      url.searchParams.set('token', jwt)
      res.redirect(302, url.toString())
    } else {
      res.redirect(`${process.env.FRONTEND_URL || 'http://localhost:5173'}?token=${jwt}`)
    }
  } catch (err) {
    console.error('OAuth callback error:', err)
    res.status(500).json({ error: { message: 'Authentication failed', code: 'AUTH_ERROR' } })
  }
})

export default router