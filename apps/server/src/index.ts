import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'
import { getDb, closeDb, createTables } from '@expense/expense-service'
import authRoutes from './routes/auth.js'
import userRoutes from './routes/user.js'
import expenseRoutes from './routes/expenses.js'
import tagRoutes from './routes/tags.js'
import summaryRoutes from './routes/summary.js'
import apikeyRoutes from './routes/apikeys.js'
import { oauthRouter, mcpApiRouter } from './mcp-oauth.js'
import { authMiddleware } from './middleware/auth.js'
import { mcpAuthMiddleware, handleMcpRequest } from './mcp-handler.js'
import 'dotenv/config'

const __dirname = dirname(fileURLToPath(import.meta.url))
const CLIENT_DIST = join(__dirname, '..', '..', 'client', 'dist')

const app = express()
const PORT = parseInt(process.env.PORT || '3001', 10)

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

app.use('/api', authMiddleware, mcpApiRouter)

app.use(oauthRouter)

app.all('/mcp', mcpAuthMiddleware, handleMcpRequest)

app.use(express.static(CLIENT_DIST))

app.use((req, res) => {
  if (req.accepts('html') && !req.path.startsWith('/api/') && !req.path.startsWith('/auth/') && !req.path.startsWith('/.')) {
    res.status(200).sendFile(join(CLIENT_DIST, 'index.html'))
  } else {
    res.status(404).json({ error: { message: 'Not found', code: 'NOT_FOUND' } })
  }
})

app.use((err: Error, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('Unhandled error:', err)
  res.status(500).json({ error: { message: 'Internal server error', code: 'INTERNAL_ERROR' } })
})

async function start() {
  const db = await getDb()
  await createTables(db)

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`)
  })
}

start().catch(console.error)

process.on('SIGINT', () => { closeDb(); process.exit(0) })
process.on('SIGTERM', () => { closeDb(); process.exit(0) })

export default app