import { Router } from 'express'
import { randomUUID, createHash, randomBytes } from 'node:crypto'
import { getDb, queryOne, queryAll, execute } from '@expense/expense-service'
import jwt from 'jsonwebtoken'
import express from 'express'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production'
const BASE_URL = process.env.PUBLIC_URL || `http://localhost:${parseInt(process.env.PORT || '3001', 10)}`
const SERVER_URL = `${BASE_URL}/mcp`
const ISSUER_URL = BASE_URL

function generateAuthCode(): string {
  return randomUUID().replace(/-/g, '') + randomBytes(16).toString('hex')
}

export const oauthRouter = Router()

oauthRouter.get('/.well-known/oauth-authorization-server', (_req, res) => {
  res.json({
    issuer: ISSUER_URL,
    authorization_endpoint: `${BASE_URL}/authorize`,
    token_endpoint: `${BASE_URL}/token`,
    registration_endpoint: `${BASE_URL}/register`,
    revocation_endpoint: `${BASE_URL}/revoke`,
    response_types_supported: ['code'],
    grant_types_supported: ['authorization_code', 'refresh_token'],
    code_challenge_methods_supported: ['S256'],
    token_endpoint_auth_methods_supported: ['client_secret_post', 'none'],
    scopes_supported: ['expenses:read', 'expenses:write'],
  })
})

oauthRouter.get('/.well-known/oauth-protected-resource/mcp', (_req, res) => {
  res.json({
    resource: SERVER_URL,
    authorization_servers: [ISSUER_URL],
    bearer_methods_supported: ['header'],
    scopes_supported: ['expenses:read', 'expenses:write'],
  })
})

oauthRouter.get('/.well-known/oauth-protected-resource', (_req, res) => {
  res.json({
    resource: SERVER_URL,
    authorization_servers: [ISSUER_URL],
    bearer_methods_supported: ['header'],
    scopes_supported: ['expenses:read', 'expenses:write'],
  })
})

oauthRouter.post('/register', express.json(), async (req, res) => {
  try {
    const { redirect_uris, client_name, token_endpoint_auth_method } = req.body
    if (!redirect_uris || !Array.isArray(redirect_uris) || redirect_uris.length === 0) {
      res.status(400).json({ error: 'invalid_redirect_uri', error_description: 'redirect_uris is required' })
      return
    }
    const isPublic = token_endpoint_auth_method === 'none'
    const clientId = randomUUID()
    const clientSecret = isPublic ? undefined : randomBytes(32).toString('hex')
    const now = Math.floor(Date.now() / 1000)
    const secretExpiry = isPublic ? undefined : now + 30 * 24 * 60 * 60

    const db = await getDb()
    await execute(db, `INSERT INTO oauth_clients (client_id, client_secret, redirect_uris, client_name, client_id_issued_at, client_secret_expires_at)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [clientId, clientSecret, JSON.stringify(redirect_uris), client_name || null, now, secretExpiry ?? null])


    res.status(201).json({
      client_id: clientId,
      client_secret: clientSecret,
      client_id_issued_at: now,
      client_secret_expires_at: secretExpiry,
      redirect_uris,
      client_name: client_name || null,
      token_endpoint_auth_method: token_endpoint_auth_method || 'client_secret_post',
      grant_types: ['authorization_code', 'refresh_token'],
      response_types: ['code'],
    })
  } catch (err: any) {
    res.status(500).json({ error: 'server_error', error_description: err.message })
  }
})

oauthRouter.post('/revoke', express.urlencoded({ extended: false }), async (req, res) => {
  try {
    const { token, token_type_hint } = req.body
    if (!token) {
      res.status(400).json({ error: 'invalid_request', error_description: 'token is required' })
      return
    }
    const hash = createHash('sha256').update(token).digest('hex')
    const db = await getDb()
    const field = token_type_hint === 'refresh_token' ? 'refresh_token_hash' : 'access_token_hash'
    await execute(db, `UPDATE oauth_tokens SET revoked_at = NOW() WHERE ${field} = ? AND revoked_at IS NULL`, [hash])

    res.status(200).json({})
  } catch {
    res.status(200).json({})
  }
})

oauthRouter.all('/authorize', (req, res, next) => {
  express.urlencoded({ extended: false })(req, res, () => {
    express.json()(req, res, next)
  })
}, async (req, res) => {
  const { client_id, redirect_uri, response_type, code_challenge, code_challenge_method, state, scope } = req.method === 'POST' ? req.body : req.query as any

  if (!client_id) {
    res.status(400).json({ error: 'invalid_request', error_description: 'client_id is required' })
    return
  }
  if (response_type !== 'code') {
    res.status(400).json({ error: 'unsupported_response_type', error_description: 'Only authorization_code grant is supported' })
    return
  }
  if (!code_challenge || !code_challenge_method) {
    res.status(400).json({ error: 'invalid_request', error_description: 'PKCE is required' })
    return
  }
  if (code_challenge_method !== 'S256') {
    res.status(400).json({ error: 'invalid_request', error_description: 'Only S256 code_challenge_method is supported' })
    return
  }

  const db = await getDb()
  let client = await queryOne(db, 'SELECT * FROM oauth_clients WHERE client_id = ?', [client_id])
  if (!client) {
    await execute(db, `INSERT INTO oauth_clients (client_id, client_secret, redirect_uris, client_name, client_id_issued_at)
      VALUES (?, ?, ?, ?, ?)`,
      [client_id, null, JSON.stringify([redirect_uri]), null, Math.floor(Date.now() / 1000)])

    client = await queryOne(db, 'SELECT * FROM oauth_clients WHERE client_id = ?', [client_id])
  }
  if (!client) {
    res.status(500).json({ error: 'server_error', error_description: 'Failed to create or find client' })
    return
  }

  let registeredUris: string[]
  try { registeredUris = JSON.parse(client.redirect_uris as string) } catch { registeredUris = [] }
  const finalRedirect = redirect_uri || (registeredUris.length === 1 ? registeredUris[0] : null)
  if (!finalRedirect) {
    res.status(400).json({ error: 'invalid_request', error_description: 'No redirect_uri provided and client has none registered' })
    return
  }
  if (!registeredUris.includes(finalRedirect)) {
    registeredUris.push(finalRedirect)
    await execute(db, 'UPDATE oauth_clients SET redirect_uris = ? WHERE client_id = ?',
      [JSON.stringify(registeredUris), client_id])

  }

  if (req.method === 'POST' && req.body.token) {
    try {
      const payload = jwt.verify(req.body.token, JWT_SECRET) as any
      const userId = payload.userId

      // Set JWT cookie for future auto-auth
      res.cookie('mcp_token', req.body.token, { httpOnly: true, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 })

      const code = generateAuthCode()
      await execute(db, `INSERT INTO oauth_auth_codes (code, client_id, user_id, scope, code_challenge, code_challenge_method, redirect_uri, resource, expires_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW() + INTERVAL '10 minutes')`,
        [code, client_id, userId, scope || '', code_challenge, code_challenge_method, finalRedirect, null])
  

      const url = new URL(finalRedirect)
      url.searchParams.set('code', code)
      url.searchParams.set('state', state || '')
      res.redirect(302, url.toString())
      return
    } catch {
      res.send(htmlPage('Authentication Failed',
        `<p style="color:#c44">Invalid or expired token. Get your token from the Expense Tracker app settings page.</p>
        <form method="POST" action="/authorize">
          <input type="hidden" name="client_id" value="${escapeHtml(client_id)}">
          <input type="hidden" name="redirect_uri" value="${escapeHtml(finalRedirect)}">
          <input type="hidden" name="response_type" value="code">
          <input type="hidden" name="code_challenge" value="${escapeHtml(code_challenge)}">
          <input type="hidden" name="code_challenge_method" value="S256">
          ${state ? `<input type="hidden" name="state" value="${escapeHtml(state)}">` : ''}
          <label>API Token:<br><input type="text" name="token" style="width:100%;padding:8px;margin:8px 0;font-family:monospace"></label>
          <p style="color:#888;font-size:14px">Paste your JWT token from the Expense Tracker app.</p>
          <button type="submit" style="padding:10px 24px;background:#1a1a1a;color:#fff;border:none;border-radius:4px;cursor:pointer">Verify Token</button>
        </form>`))
      return
    }
  }

  function buildGoogleAuthUrl() {
    const mcpState = Buffer.from(JSON.stringify({
      mcp_authorize: '1',
      client_id,
      redirect_uri: finalRedirect,
      code_challenge,
      scope: scope || '',
      oauth_state: state || '',
    })).toString('base64url')
    return `/auth/google?state=${encodeURIComponent(mcpState)}`
  }

  async function completeAuthViaUserId(userId: string) {
    const code = generateAuthCode()
    await execute(db, `INSERT INTO oauth_auth_codes (code, client_id, user_id, scope, code_challenge, code_challenge_method, redirect_uri, resource, expires_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW() + INTERVAL '10 minutes')`,
      [code, client_id, userId, scope || '', code_challenge, code_challenge_method, finalRedirect, null])

    const url = new URL(finalRedirect)
    url.searchParams.set('code', code)
    url.searchParams.set('state', state || '')
    res.redirect(302, url.toString())
  }

  async function tryCookieAuth(): Promise<boolean> {
    const cookieToken = req.cookies?.mcp_token as string | undefined
    if (!cookieToken) return false
    try {
      const payload = jwt.verify(cookieToken, JWT_SECRET) as any
      await completeAuthViaUserId(payload.userId)
      return true
    } catch {
      return false
    }
  }

  // POST without token — user clicked "Login with Google" or submitted the <form>
  if (req.method === 'POST' && !req.body.token) {
    if (await tryCookieAuth()) return
    // No cookie — redirect to the main app so it can grab JWT from localStorage
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173'
    const redirectParams = new URLSearchParams({
      client_id,
      redirect_uri: finalRedirect,
      response_type: 'code',
      code_challenge,
      code_challenge_method: 'S256',
    })
    if (scope) redirectParams.set('scope', scope)
    if (state) redirectParams.set('state', state)
    res.redirect(302, `${frontendUrl}/mcp-auth?${redirectParams.toString()}`)
    return
  }

  // GET — initial page load
  if (req.method === 'GET') {
    if (await tryCookieAuth()) return

    const hiddenFields = `
      <input type="hidden" name="client_id" value="${escapeHtml(client_id)}">
      <input type="hidden" name="redirect_uri" value="${escapeHtml(finalRedirect)}">
      <input type="hidden" name="response_type" value="code">
      <input type="hidden" name="code_challenge" value="${escapeHtml(code_challenge)}">
      <input type="hidden" name="code_challenge_method" value="S256">
      ${state ? `<input type="hidden" name="state" value="${escapeHtml(state)}">` : ''}`

    res.send(htmlPage('Authorize Expense Tracker MCP',
      `<p style="margin-bottom:16px">The application <strong>${escapeHtml(client.client_name as string || client_id)}</strong> requests access to your expenses.</p>
      <div style="margin-bottom:20px">
        <form method="POST" action="/authorize" style="display:inline">
          ${hiddenFields}
          <button type="submit" style="display:inline-block;padding:12px 24px;background:#1a1a1a;color:#fff;border:none;border-radius:4px;font-size:15px;cursor:pointer">Login with Google</button>
        </form>
      </div>
      <hr style="border:none;border-top:1px solid #ddd;margin-bottom:20px">
      <p style="color:#888;font-size:14px;margin-bottom:12px">Or paste an API token:</p>
      <form method="POST" action="/authorize">
        ${hiddenFields}
        <label>API Token:<br><input type="text" name="token" style="width:100%;padding:8px;margin:8px 0;font-family:monospace"></label>
        <p style="color:#888;font-size:14px">Paste your JWT token from the Expense Tracker app.</p>
        <div style="margin-top:16px">
          <button type="submit" style="padding:10px 24px;background:#1a1a1a;color:#fff;border:none;border-radius:4px;cursor:pointer">Authenticate</button>
        </div>
      </form>`))
    return
  }

  res.status(400).json({ error: 'invalid_request' })
})

oauthRouter.post('/token', express.urlencoded({ extended: false }), async (req, res) => {
  try {
    const { grant_type, code, code_verifier, redirect_uri, refresh_token, scope, resource, client_id, client_secret } = req.body

    const db = await getDb()

    if (grant_type === 'authorization_code') {
      if (!code || !code_verifier) {
        res.status(400).json({ error: 'invalid_request', error_description: 'code and code_verifier are required' })
        return
      }

      const authCode = await queryOne(db, 'SELECT * FROM oauth_auth_codes WHERE code = ? AND used = 0 AND expires_at > NOW()', [code])
      if (!authCode) {
        res.status(400).json({ error: 'invalid_grant', error_description: 'Invalid or expired authorization code' })
        return
      }

      const challenge = authCode.code_challenge as string
      const verifierHash = createHash('sha256').update(code_verifier).digest('base64url')
      if (verifierHash !== challenge) {
        res.status(400).json({ error: 'invalid_grant', error_description: 'PKCE verification failed' })
        return
      }

      await execute(db, "UPDATE oauth_auth_codes SET used = 1 WHERE code = ?", [code])

      const userId = authCode.user_id as string
      const scopes = (authCode.scope as string) || 'expenses:read expenses:write'
      const accessToken = randomUUID().replace(/-/g, '') + randomBytes(32).toString('hex')
      const refreshTok = randomUUID().replace(/-/g, '') + randomBytes(32).toString('hex')
      const accessHash = createHash('sha256').update(accessToken).digest('hex')
      const refreshHash = createHash('sha256').update(refreshTok).digest('hex')

      await execute(db, `INSERT INTO oauth_tokens (id, access_token_hash, refresh_token_hash, client_id, user_id, scope, expires_at, refresh_expires_at)
        VALUES (?, ?, ?, ?, ?, ?, NOW() + INTERVAL '1 hour', NOW() + INTERVAL '30 days')`,
        [randomUUID(), accessHash, refreshHash, authCode.client_id as string, userId, scopes])
  

      res.json({
        access_token: accessToken,
        refresh_token: refreshTok,
        token_type: 'Bearer',
        expires_in: 3600,
        scope: scopes,
      })
      return
    }

    if (grant_type === 'refresh_token') {
      if (!refresh_token) {
        res.status(400).json({ error: 'invalid_request', error_description: 'refresh_token is required' })
        return
      }

      const refreshHash = createHash('sha256').update(refresh_token).digest('hex')
      const stored = await queryOne(db, 'SELECT * FROM oauth_tokens WHERE refresh_token_hash = ? AND revoked_at IS NULL AND refresh_expires_at > NOW()', [refreshHash])
      if (!stored) {
        res.status(400).json({ error: 'invalid_grant', error_description: 'Invalid or expired refresh token' })
        return
      }

      await execute(db, 'UPDATE oauth_tokens SET revoked_at = NOW() WHERE id = ?', [stored.id])

      const newAccessToken = randomUUID().replace(/-/g, '') + randomBytes(32).toString('hex')
      const newRefreshTok = randomUUID().replace(/-/g, '') + randomBytes(32).toString('hex')
      const newAccessHash = createHash('sha256').update(newAccessToken).digest('hex')
      const newRefreshHash = createHash('sha256').update(newRefreshTok).digest('hex')

      await execute(db, `INSERT INTO oauth_tokens (id, access_token_hash, refresh_token_hash, client_id, user_id, scope, expires_at, refresh_expires_at)
        VALUES (?, ?, ?, ?, ?, ?, NOW() + INTERVAL '1 hour', NOW() + INTERVAL '30 days')`,
        [randomUUID(), newAccessHash, newRefreshHash, stored.client_id as string, stored.user_id as string, stored.scope as string])
  

      res.json({
        access_token: newAccessToken,
        refresh_token: newRefreshTok,
        token_type: 'Bearer',
        expires_in: 3600,
        scope: stored.scope,
      })
      return
    }

    res.status(400).json({ error: 'unsupported_grant_type', error_description: `Grant type '${grant_type}' is not supported` })
  } catch (err: any) {
    res.status(500).json({ error: 'server_error', error_description: err.message })
  }
})

export async function verifyMcpToken(token: string): Promise<{ token: string; clientId: string; scopes: string[]; expiresAt?: number; extra?: Record<string, unknown> }> {
  const hash = createHash('sha256').update(token).digest('hex')
  const db = await getDb()
  const row = await queryOne(db, `SELECT * FROM oauth_tokens WHERE access_token_hash = ? AND revoked_at IS NULL AND expires_at > NOW()`, [hash])
  if (!row) throw new Error('Invalid or expired token')
  return {
    token,
    clientId: row.client_id as string,
    scopes: (row.scope as string || '').split(' ').filter(Boolean),
    expiresAt: Math.floor(new Date((row.expires_at as string) + 'Z').getTime() / 1000),
    extra: { userId: row.user_id },
  }
}

const ASSISTANTS: Record<string, { name: string; redirectUri: string }> = {
  claude: { name: 'Claude.ai', redirectUri: 'https://claude.ai/api/mcp/auth_callback' },
  chatgpt: { name: 'ChatGPT', redirectUri: 'https://chatgpt.com/api/mcp/auth_callback' },
}

export const mcpApiRouter = Router()

mcpApiRouter.post('/mcp/register', async (req, res) => {
  try {
    const user = (req as any).user
    if (!user?.userId) {
      res.status(401).json({ error: 'Not authenticated' })
      return
    }

    const { assistant } = req.body
    const config = assistant ? ASSISTANTS[assistant as string] : null
    if (assistant && !config) {
      res.status(400).json({ error: `Unknown assistant. Supported: ${Object.keys(ASSISTANTS).join(', ')}` })
      return
    }

    const redirectUris = config ? [config.redirectUri] : (req.body.redirect_uris || ['http://localhost:3000/callback'])
    const clientName = config ? config.name : (req.body.client_name || 'Custom')

    const db = await getDb()
    const clientId = randomUUID()
    const clientSecret = randomBytes(32).toString('hex')
    const now = Math.floor(Date.now() / 1000)
    const secretExpiry = now + 30 * 24 * 60 * 60

    await execute(db, `INSERT INTO oauth_clients (client_id, client_secret, redirect_uris, client_name, client_id_issued_at, client_secret_expires_at)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [clientId, clientSecret, JSON.stringify(redirectUris), clientName, now, secretExpiry])


    res.status(201).json({
      data: {
        client_id: clientId,
        client_secret: clientSecret,
        client_name: clientName,
        redirect_uri: redirectUris[0],
        authorization_url: `${BASE_URL}/authorize`,
        token_url: `${BASE_URL}/token`,
        mcp_url: `${BASE_URL}/mcp`,
        scopes: 'expenses:read expenses:write',
      },
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

mcpApiRouter.get('/mcp/clients', async (req, res) => {
  try {
    const user = (req as any).user
    if (!user?.userId) {
      res.status(401).json({ error: 'Not authenticated' })
      return
    }

    const db = await getDb()
    const rows = await queryAll(db, `SELECT DISTINCT c.client_id, c.client_name, c.redirect_uris, c.created_at,
      (SELECT COUNT(*) FROM oauth_tokens t WHERE t.client_id = c.client_id AND t.user_id = ? AND t.revoked_at IS NULL) as token_count
      FROM oauth_clients c
      WHERE EXISTS (SELECT 1 FROM oauth_tokens t WHERE t.client_id = c.client_id AND t.user_id = ? AND t.revoked_at IS NULL)
      ORDER BY c.created_at DESC`, [user.userId, user.userId])

    res.json({
      data: rows.map(r => ({
        client_id: r.client_id,
        client_name: r.client_name || extractDomain(String(r.redirect_uris || '')),
        redirect_uri: extractFirstUri(String(r.redirect_uris || '')),
        created_at: r.created_at,
        active: Number(r.token_count) > 0,
      })),
    })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

mcpApiRouter.delete('/mcp/clients/:clientId', async (req, res) => {
  try {
    const user = (req as any).user
    if (!user?.userId) {
      res.status(401).json({ error: 'Not authenticated' })
      return
    }

    const db = await getDb()
    await execute(db, `UPDATE oauth_tokens SET revoked_at = NOW() WHERE client_id = ? AND user_id = ? AND revoked_at IS NULL`,
      [req.params.clientId, user.userId])


    res.json({ data: { success: true } })
  } catch (err: any) {
    res.status(500).json({ error: err.message })
  }
})

function extractDomain(uris: string): string {
  try { return new URL(JSON.parse(uris)[0]).hostname } catch { return 'Unknown' }
}

function extractFirstUri(uris: string): string {
  try { return JSON.parse(uris)[0] } catch { return uris }
}

function escapeHtml(s: string): string {
  return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function htmlPage(title: string, body: string): string {
  return `<!DOCTYPE html>
<html><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>
* { box-sizing:border-box; margin:0; padding:0 }
body { font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif; background:#f5f0e8; color:#1a1a1a; display:flex; justify-content:center; align-items:center; min-height:100vh }
.card { background:#fff; border-radius:8px; padding:32px; max-width:480px; width:90%; box-shadow:0 2px 8px rgba(0,0,0,0.08) }
h1 { font-size:20px; margin-bottom:16px }
input,button { font-size:15px }
button:hover { opacity:0.9 }
</style></head>
<body><div class="card"><h1>${escapeHtml(title)}</h1>${body}</div></body></html>`
}
