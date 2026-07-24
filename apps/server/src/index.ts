import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { getDb, saveDb, closeDb, createTables } from '@expense/expense-service'
import authRoutes from './routes/auth.js'
import userRoutes from './routes/user.js'
import expenseRoutes from './routes/expenses.js'
import tagRoutes from './routes/tags.js'
import summaryRoutes from './routes/summary.js'
import apikeyRoutes from './routes/apikeys.js'
import { oauthRouter, ensureOAuthTables } from './mcp-oauth.js'
import { mcpAuthMiddleware, handleMcpRequest } from './mcp-handler.js'
import 'dotenv/config'

const app = express()
const PORT = parseInt(process.env.PORT || '3001', 10)

// app.use(cors({
//   origin: process.env.FRONTEND_URL || 'http://localhost:5173',
//   credentials: true,
// }))
app.use(cors())

app.use(cookieParser())
app.use(express.json())

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

app.use('/auth', authRoutes)
app.use('/api', userRoutes)
app.use('/api/expenses', expenseRoutes)
app.use('/api/tags', tagRoutes)
app.use('/api/summary', summaryRoutes)
app.use('/api/apikeys', apikeyRoutes)

app.use(oauthRouter)

app.all('/mcp', mcpAuthMiddleware, handleMcpRequest)

app.use((_req, res) => {
  res.status(404).json({ error: { message: 'Not found', code: 'NOT_FOUND' } })
})

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } })
})

async function start() {
  const db = await getDb()
  await createTables(db)
  saveDb()
  ensureOAuthTables(db)

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
  })
}

start().catch(console.error)

process.on('SIGINT', () => { closeDb(); process.exit(0) })
process.on('SIGTERM', () => { closeDb(); process.exit(0) })

export default app