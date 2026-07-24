#!/usr/bin/env bash
set -euo pipefail

BASE=${1:-http://localhost:3000}
DIR=$(cd "$(dirname "$0")" && pwd)
TMPDIR=$(mktemp -d)
trap 'rm -rf "$TMPDIR"' EXIT

G='\033[0;32m' R='\033[0;31m' B='\033[0;34m' N='\033[0m'

info()  { echo -e "${B}[*]${N} $1"; }
ok()    { echo -e "${G}[✓]${N} $1"; }
fail()  { echo -e "${R}[✗]${N} $1"; exit 1; }

# Optionally start a fresh server
if [ "${2:-}" = "--start" ]; then
  info "Starting server…"
  rm -f "$DIR/../data/expense-tracker.db"
  USE_MOCK_DATA=true PORT=3000 PUBLIC_URL=http://localhost:3000 \
    bun run "$DIR/../src/index.ts" &
  SERVER_PID=$!
  sleep 5
  if ! kill -0 "$SERVER_PID" 2>/dev/null; then
    fail "Server failed to start"
  fi
  trap 'kill "$SERVER_PID" 2>/dev/null; rm -rf "$TMPDIR"' EXIT
  ok "Server started (PID $SERVER_PID)"
fi

# ── 1. Register a client ──
info "Registering client…"
curl -s -X POST "$BASE/register" \
  -m 10 \
  -H 'Content-Type: application/json' \
  -d '{"redirect_uris":["http://localhost:3000/callback"],"client_name":"Test Client"}' \
  -o "$TMPDIR/register.json" || fail "Register failed"
CID=$(python3 -c "import json;print(json.load(open('$TMPDIR/register.json'))['client_id'])")
CSEC=$(python3 -c "import json;print(json.load(open('$TMPDIR/register.json'))['client_secret'])")
ok "Client ID: $CID"

# ── 2. Generate PKCE ──
info "Generating PKCE…"
PKCE=$(cd "$DIR" && bun -e "
const c=require('crypto');
const v=c.randomBytes(32).toString('base64url');
const ch=c.createHash('sha256').update(v).digest('base64url');
console.log(v+'|'+ch);
")
VERIFIER=$(echo "$PKCE" | cut -d'|' -f1)
CHALLENGE=$(echo "$PKCE" | cut -d'|' -f2)
ok "PKCE ready"

# ── 3. Get a JWT token ──
info "Generating JWT…"
JWT=$(cd "$DIR" && bun -e "
const jwt=require('jsonwebtoken');
const s=process.env.JWT_SECRET||'dev-secret-change-in-production';console.log(jwt.sign({userId:'test-user-001',email:'test@example.com'},s,{expiresIn:'7d'}));
")
ok "JWT: ${JWT:0:40}…"

# ── 4. Authorize ──
info "Authorizing…"
curl -s -X POST "$BASE/authorize" \
  -m 10 \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "client_id=$CID&redirect_uri=http://localhost:3000/callback&response_type=code&code_challenge=$CHALLENGE&code_challenge_method=S256&state=test&token=$JWT&approve=yes" \
  -o "$TMPDIR/auth_resp.txt" || fail "Authorize failed"
AUTH_CODE=$(sed -n 's/.*code=\([^&[:space:]]*\).*/\1/p' "$TMPDIR/auth_resp.txt") || fail "No auth code"
ok "Auth code: ${AUTH_CODE:0:20}…"

# ── 5. Exchange code for tokens ──
info "Exchanging code for tokens…"
curl -s -X POST "$BASE/token" \
  -m 10 \
  -H "Content-Type: application/x-www-form-urlencoded" \
  -d "grant_type=authorization_code&code=$AUTH_CODE&client_id=$CID&client_secret=$CSEC&redirect_uri=http://localhost:3000/callback&code_verifier=$VERIFIER" \
  -o "$TMPDIR/token.json" || fail "Token exchange failed"
ATOK=$(python3 -c "import json;print(json.load(open('$TMPDIR/token.json'))['access_token'])") || fail "Token exchange failed"
ok "Access token: ${ATOK:0:40}…"

# ── 6. Initialize MCP session ──
info "Initializing MCP session…"
curl -s -D "$TMPDIR/init_headers.txt" "$BASE/mcp" \
  -m 10 \
  -H "Authorization: Bearer $ATOK" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -d '{"jsonrpc":"2.0","id":1,"method":"initialize","params":{"protocolVersion":"2025-03-26","capabilities":{},"clientInfo":{"name":"test","version":"1.0.0"}}}' \
  -o "$TMPDIR/init_resp.json" || fail "MCP init failed"
SID=$(sed -n 's/.*mcp-session-id: *\([^ ]*\).*/\1/p' "$TMPDIR/init_headers.txt") || fail "No session ID"
ok "Session ID: $SID"

# ── 7. tools/list ──
info "tools/list…"
curl -s "$BASE/mcp" \
  -m 10 \
  -H "Authorization: Bearer $ATOK" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: $SID" \
  -H "mcp-protocol-version: 2025-03-26" \
  -d '{"jsonrpc":"2.0","id":2,"method":"tools/list","params":{}}' \
  -o "$TMPDIR/tools_list.json" || fail "tools/list failed"
TOOLS=$(python3 -c "
import json
d=json.load(open('$TMPDIR/tools_list.json'))
print(', '.join(t['name'] for t in d['result']['tools']))
")
ok "Tools: $TOOLS"

# ── 8. add_expense ──
info "add_expense…"
curl -s "$BASE/mcp" \
  -m 10 \
  -H "Authorization: Bearer $ATOK" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: $SID" \
  -H "mcp-protocol-version: 2025-03-26" \
  -d '{"jsonrpc":"2.0","id":3,"method":"tools/call","params":{"name":"add_expense","arguments":{"amount":250,"tags":["lunch","food"],"note":"Biryani"}}}' \
  -o "$TMPDIR/add_expense.json" || fail "add_expense failed"
ADD_MSG=$(python3 -c "
import json
d=json.load(open('$TMPDIR/add_expense.json'))
print(d['result']['content'][0]['text'])
")
ok "$ADD_MSG"

# ── 9. list_expenses ──
info "list_expenses…"
curl -s "$BASE/mcp" \
  -m 10 \
  -H "Authorization: Bearer $ATOK" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: $SID" \
  -H "mcp-protocol-version: 2025-03-26" \
  -d '{"jsonrpc":"2.0","id":4,"method":"tools/call","params":{"name":"list_expenses","arguments":{}}}' \
  -o "$TMPDIR/list_expenses.json" || fail "list_expenses failed"
LIST_MSG=$(python3 -c "
import json
d=json.load(open('$TMPDIR/list_expenses.json'))
print(d['result']['content'][0]['text'][:90])
")
ok "$LIST_MSG"

# ── 10. get_summary ──
info "get_summary…"
curl -s "$BASE/mcp" \
  -m 10 \
  -H "Authorization: Bearer $ATOK" \
  -H "Content-Type: application/json" \
  -H "Accept: application/json, text/event-stream" \
  -H "mcp-session-id: $SID" \
  -H "mcp-protocol-version: 2025-03-26" \
  -d '{"jsonrpc":"2.0","id":5,"method":"tools/call","params":{"name":"get_summary","arguments":{"by":"tag"}}}' \
  -o "$TMPDIR/summary.json" || fail "get_summary failed"
SUM_MSG=$(python3 -c "
import json
d=json.load(open('$TMPDIR/summary.json'))
print(d['result']['content'][0]['text'][:90])
")
ok "$SUM_MSG"

echo ""
echo -e "${G}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${N}"
echo -e "${G}  All 10 steps passed!                ${N}"
echo -e "${G}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${N}"
echo ""
echo "Access token : ${ATOK:0:40}…"
echo "Session ID   : $SID"
