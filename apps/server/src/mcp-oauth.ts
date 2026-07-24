import { Router } from 'express'
import { randomUUID, createHash, randomBytes } from 'node:crypto'
import { getDb, saveDb, queryOne, queryAll, execute } from '@expense/expense-service'
import jwt from 'jsonwebtoken'
import express from 'express'

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production'
const BASE_URL = process.env.PUBLIC_URL || `http://localhost:${parseInt(process.env.PORT || '3001', 10)}`
const SERVER_URL = `${BASE_URL}/mcp`
const ISSUER_URL = BASE_URL

export function ensureOAuthTables(db: any) {
  db.run(`CREATE TABLE IF NOT EXISTS oauth_clients (
    client_id TEXT PRIMARY KEY,
    client_secret TEXT,
    redirect_uris TEXT NOT NULL,
    grant_types TEXT NOT NULL DEFAULT '["authorization_code","refresh_token"]',
    response_types TEXT NOT NULL DEFAULT '["code"]',
    client_name TEXT,
    scope TEXT DEFAULT '',
    client_id_issued_at INTEGER,
    client_secret_expires_at INTEGER,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
  )`)
  db.run(`CREATE TABLE IF NOT EXISTS oauth_auth_codes (
    code TEXT PRIMARY KEY,
    client_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    scope TEXT,
    code_challenge TEXT NOT NULL,
    code_challenge_method TEXT NOT NULL DEFAULT 'S256',
    redirect_uri TEXT NOT NULL,
    resource TEXT,
    expires_at TEXT NOT NULL,
    used INTEGER NOT NULL DEFAULT 0,
    FOREIGN KEY (client_id) REFERENCES oauth_clients(client_id)
  )`)
  db.run(`CREATE TABLE IF NOT EXISTS oauth_tokens (
    id TEXT PRIMARY KEY,
    access_token_hash TEXT NOT NULL,
    refresh_token_hash TEXT,
    client_id TEXT NOT NULL,
    user_id TEXT NOT NULL,
    scope TEXT DEFAULT '',
    expires_at TEXT NOT NULL,
    refresh_expires_at TEXT,
    revoked_at TEXT,
    FOREIGN KEY (client_id) REFERENCES oauth_clients(client_id)
  )`)
  saveDb()
}

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
    execute(db, `INSERT INTO oauth_clients (client_id, client_secret, redirect_uris, client_name, client_id_issued_at, client_secret_expires_at)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [clientId, clientSecret, JSON.stringify(redirect_uris), client_name || null, now, secretExpiry ?? null])
    saveDb()

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
    execute(db, `UPDATE oauth_tokens SET revoked_at = datetime('now') WHERE ${field} = ? AND revoked_at IS NULL`, [hash])
    saveDb()
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
  let client = queryOne(db, 'SELECT * FROM oauth_clients WHERE client_id = ?', [client_id])
  if (!client) {
    execute(db, `INSERT INTO oauth_clients (client_id, client_secret, redirect_uris, client_name, client_id_issued_at)
      VALUES (?, ?, ?, ?, ?)`,
      [client_id, null, JSON.stringify([redirect_uri]), null, Math.floor(Date.now() / 1000)])
    saveDb()
    client = queryOne(db, 'SELECT * FROM oauth_clients WHERE client_id = ?', [client_id])
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
    execute(db, 'UPDATE oauth_clients SET redirect_uris = ? WHERE client_id = ?',
      [JSON.stringify(registeredUris), client_id])
    saveDb()
  }

  if (req.method === 'POST' && req.body.token) {
    try {
      const payload = jwt.verify(req.body.token, JWT_SECRET) as any
      const userId = payload.userId

      // Set JWT cookie for future auto-auth
      res.cookie('mcp_token', req.body.token, { httpOnly: true, sameSite: 'lax', maxAge: 7 * 24 * 60 * 60 * 1000 })

      const code = generateAuthCode()
      execute(db, `INSERT INTO oauth_auth_codes (code, client_id, user_id, scope, code_challenge, code_challenge_method, redirect_uri, resource, expires_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '+10 minutes'))`,
        [code, client_id, userId, scope || '', code_challenge, code_challenge_method, finalRedirect, null])
      saveDb()

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

  if (req.method === 'GET' || !req.body.token) {
    // Auto-auth via JWT cookie
    const cookieToken = req.cookies?.mcp_token as string | undefined
    if (cookieToken) {
      try {
        const payload = jwt.verify(cookieToken, JWT_SECRET) as any
        const userId = payload.userId
        const code = generateAuthCode()
        execute(db, `INSERT INTO oauth_auth_codes (code, client_id, user_id, scope, code_challenge, code_challenge_method, redirect_uri, resource, expires_at)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now', '+10 minutes'))`,
          [code, client_id, userId, scope || '', code_challenge, code_challenge_method, finalRedirect, null])
        saveDb()
        const url = new URL(finalRedirect)
        url.searchParams.set('code', code)
        url.searchParams.set('state', state || '')
        res.redirect(302, url.toString())
        return
      } catch {
        // Cookie invalid — fall through to show form
      }
    }

    // Build the "Login with Google" link that carries MCP authorize params
    const mcpState = Buffer.from(JSON.stringify({
      mcp_authorize: '1',
      client_id,
      redirect_uri: finalRedirect,
      code_challenge,
      scope: scope || '',
      oauth_state: state || '',
    })).toString('base64url')
    const googleAuthUrl = `/auth/google?state=${encodeURIComponent(mcpState)}`

    res.send(htmlPage('Authorize Expense Tracker MCP',
      `<p style="margin-bottom:16px">The application <strong>${escapeHtml(client.client_name as string || client_id)}</strong> requests access to your expenses.</p>
      <div style="margin-bottom:20px">
        <a href="${escapeHtml(googleAuthUrl)}" style="display:inline-block;padding:12px 24px;background:#1a1a1a;color:#fff;text-decoration:none;border-radius:4px;font-size:15px;cursor:pointer">Login with Google</a>
      </div>
      <hr style="border:none;border-top:1px solid #ddd;margin-bottom:20px">
      <p style="color:#888;font-size:14px;margin-bottom:12px">Or paste an API token:</p>
      <form method="POST" action="/authorize">
        <input type="hidden" name="client_id" value="${escapeHtml(client_id)}">
        <input type="hidden" name="redirect_uri" value="${escapeHtml(finalRedirect)}">
        <input type="hidden" name="response_type" value="code">
        <input type="hidden" name="code_challenge" value="${escapeHtml(code_challenge)}">
        <input type="hidden" name="code_challenge_method" value="S256">
        ${state ? `<input type="hidden" name="state" value="${escapeHtml(state)}">` : ''}
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

      const authCode = queryOne(db, 'SELECT * FROM oauth_auth_codes WHERE code = ? AND used = 0 AND expires_at > datetime(\'now\')', [code])
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

      execute(db, "UPDATE oauth_auth_codes SET used = 1 WHERE code = ?", [code])

      const userId = authCode.user_id as string
      const scopes = (authCode.scope as string) || 'expenses:read expenses:write'
      const accessToken = randomUUID().replace(/-/g, '') + randomBytes(32).toString('hex')
      const refreshTok = randomUUID().replace(/-/g, '') + randomBytes(32).toString('hex')
      const accessHash = createHash('sha256').update(accessToken).digest('hex')
      const refreshHash = createHash('sha256').update(refreshTok).digest('hex')

      execute(db, `INSERT INTO oauth_tokens (id, access_token_hash, refresh_token_hash, client_id, user_id, scope, expires_at, refresh_expires_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now', '+1 hour'), datetime('now', '+30 days'))`,
        [randomUUID(), accessHash, refreshHash, authCode.client_id as string, userId, scopes])
      saveDb()

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
      const stored = queryOne(db, 'SELECT * FROM oauth_tokens WHERE refresh_token_hash = ? AND revoked_at IS NULL AND refresh_expires_at > datetime(\'now\')', [refreshHash])
      if (!stored) {
        res.status(400).json({ error: 'invalid_grant', error_description: 'Invalid or expired refresh token' })
        return
      }

      execute(db, 'UPDATE oauth_tokens SET revoked_at = datetime(\'now\') WHERE id = ?', [stored.id])

      const newAccessToken = randomUUID().replace(/-/g, '') + randomBytes(32).toString('hex')
      const newRefreshTok = randomUUID().replace(/-/g, '') + randomBytes(32).toString('hex')
      const newAccessHash = createHash('sha256').update(newAccessToken).digest('hex')
      const newRefreshHash = createHash('sha256').update(newRefreshTok).digest('hex')

      execute(db, `INSERT INTO oauth_tokens (id, access_token_hash, refresh_token_hash, client_id, user_id, scope, expires_at, refresh_expires_at)
        VALUES (?, ?, ?, ?, ?, ?, datetime('now', '+1 hour'), datetime('now', '+30 days'))`,
        [randomUUID(), newAccessHash, newRefreshHash, stored.client_id as string, stored.user_id as string, stored.scope as string])
      saveDb()

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
  const row = queryOne(db, `SELECT * FROM oauth_tokens WHERE access_token_hash = ? AND revoked_at IS NULL AND expires_at > datetime('now')`, [hash])
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

    execute(db, `INSERT INTO oauth_clients (client_id, client_secret, redirect_uris, client_name, client_id_issued_at, client_secret_expires_at)
      VALUES (?, ?, ?, ?, ?, ?)`,
      [clientId, clientSecret, JSON.stringify(redirectUris), clientName, now, secretExpiry])
    saveDb()

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
