import { createHash, randomBytes } from 'crypto'
import jwt from 'jsonwebtoken'

const BASE = process.argv[2] || 'http://localhost:3000'

async function json(url, opts) {
  const res = await fetch(url, opts)
  return res.json()
}

async function text(url, opts) {
  const res = await fetch(url, opts)
  return res.text()
}

async function raw(url, opts) {
  return fetch(url, opts)
}

try {
  // 1. Register
  console.log('[*] Registering client…')
  const reg = await json(`${BASE}/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ redirect_uris: ['http://localhost:3000/callback'], client_name: 'Test Client' }),
  })
  console.log('[✓] Client ID:', reg.client_id)

  // 2. PKCE
  console.log('[*] Generating PKCE…')
  const verifier = randomBytes(32).toString('base64url')
  const challenge = createHash('sha256').update(verifier).digest('base64url')
  console.log('[✓] PKCE ready')

  // 3. JWT
  console.log('[*] Generating JWT…')
  const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret-change-in-production'
const token = jwt.sign({ userId: 'test-user-001', email: 'test@example.com' }, JWT_SECRET, { expiresIn: '7d' })
  console.log('[✓] JWT:', token.slice(0, 40) + '…')

  // 4. Authorize
  console.log('[*] Authorizing…')
  const params = new URLSearchParams({
    client_id: reg.client_id,
    redirect_uri: 'http://localhost:3000/callback',
    response_type: 'code',
    code_challenge: challenge,
    code_challenge_method: 'S256',
    state: 'test',
    token,
    approve: 'yes',
  })
  const authResp = await raw(`${BASE}/authorize`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: params,
    redirect: 'manual',
  })
  const location = authResp.headers.get('location')
  if (!location) {
    const body = await authResp.text()
    console.error('[✗] No redirect in authorize response:', body)
    process.exit(1)
  }
  const authCode = new URL(location).searchParams.get('code')
  console.log('[✓] Auth code:', authCode?.slice(0, 20) + '…')

  // 5. Token exchange
  console.log('[*] Exchanging code for tokens…')
  const tokenParams = new URLSearchParams({
    grant_type: 'authorization_code',
    code: authCode,
    client_id: reg.client_id,
    client_secret: reg.client_secret,
    redirect_uri: 'http://localhost:3000/callback',
    code_verifier: verifier,
  })
  const tok = await json(`${BASE}/token`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: tokenParams,
  })
  console.log('[✓] Access token:', (tok.access_token || '').slice(0, 40) + '…')

  // 6. Initialize MCP
  console.log('[*] Initializing MCP session…')
  const initResp = await raw(`${BASE}/mcp`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${tok.access_token}`,
      'Content-Type': 'application/json',
      Accept: 'application/json, text/event-stream',
    },
    body: JSON.stringify({
      jsonrpc: '2.0', id: 1,
      method: 'initialize',
      params: { protocolVersion: '2025-03-26', capabilities: {}, clientInfo: { name: 'test', version: '1.0.0' } },
    }),
  })
  const sid = initResp.headers.get('mcp-session-id')
  if (!sid) {
    const body = await initResp.text()
    console.error('[✗] No session ID:', body)
    process.exit(1)
  }
  console.log('[✓] Session ID:', sid)

  const mcpHeaders = {
    Authorization: `Bearer ${tok.access_token}`,
    'Content-Type': 'application/json',
    Accept: 'application/json, text/event-stream',
    'mcp-session-id': sid,
    'mcp-protocol-version': '2025-03-26',
  }

  // 7. tools/list
  console.log('[*] tools/list…')
  const toolsResp = await json(`${BASE}/mcp`, {
    method: 'POST',
    headers: mcpHeaders,
    body: JSON.stringify({ jsonrpc: '2.0', id: 2, method: 'tools/list', params: {} }),
  })
  const tools = toolsResp.result.tools.map(t => t.name).join(', ')
  console.log('[✓] Tools:', tools)

  // 8. add_expense
  console.log('[*] add_expense…')
  const addResp = await json(`${BASE}/mcp`, {
    method: 'POST',
    headers: mcpHeaders,
    body: JSON.stringify({
      jsonrpc: '2.0', id: 3, method: 'tools/call',
      params: { name: 'add_expense', arguments: { amount: 250, tags: ['lunch', 'food'], note: 'Biryani' } },
    }),
  })
  console.log('[✓]', addResp.result.content[0].text)

  // 9. list_expenses
  console.log('[*] list_expenses…')
  const listResp = await json(`${BASE}/mcp`, {
    method: 'POST',
    headers: mcpHeaders,
    body: JSON.stringify({ jsonrpc: '2.0', id: 4, method: 'tools/call', params: { name: 'list_expenses', arguments: {} } }),
  })
  console.log('[✓]', listResp.result.content[0].text.slice(0, 90))

  // 10. get_summary
  console.log('[*] get_summary…')
  const sumResp = await json(`${BASE}/mcp`, {
    method: 'POST',
    headers: mcpHeaders,
    body: JSON.stringify({ jsonrpc: '2.0', id: 5, method: 'tools/call', params: { name: 'get_summary', arguments: { by: 'tag' } } }),
  })
  console.log('[✓]', sumResp.result.content[0].text.slice(0, 90))

  console.log('')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('  All 10 steps passed!                ')
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━')
  console.log('')
  console.log('Access token:', (tok.access_token || '').slice(0, 40) + '…')
  console.log('Session ID  :', sid)
} catch (err) {
  console.error('[✗] ERROR:', err.message || err)
  process.exit(1)
}
