import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StreamableHTTPServerTransport } from '@modelcontextprotocol/sdk/server/streamableHttp.js'
import { requireBearerAuth } from '@modelcontextprotocol/sdk/server/auth/middleware/bearerAuth.js'
import { getOAuthProtectedResourceMetadataUrl } from '@modelcontextprotocol/sdk/server/auth/router.js'
import { z } from 'zod'
import { addExpense, listExpenses, getSummary, deleteExpense } from '@expense/expense-service'
import { verifyMcpToken } from './mcp-oauth.js'
import type { Request, Response } from 'express'

const mcpServer = new McpServer({
  name: 'Expense Tracker',
  version: '1.0.0',
  description: 'Log and query expenses via natural language. Data is stored in your Google Sheet.',
})

mcpServer.tool(
  'add_expense',
  'Add a new expense to your Google Sheet',
  {
    amount: z.number().positive().describe('Amount in INR (₹)'),
    tags: z.array(z.string()).describe('Tags/categories for this expense (e.g. ["lunch", "food"])'),
    note: z.string().optional().describe('Optional note or description'),
    date: z.string().optional().describe('Date in YYYY-MM-DD format (defaults to today)'),
  },
  async ({ amount, tags, note, date }, extra) => {
    try {
      const userId = extra?.authInfo?.extra?.userId as string | undefined
      if (!userId) return { content: [{ type: 'text' as const, text: 'Not authenticated' }], isError: true }
      await addExpense(userId, {
        amount,
        tags,
        note: note || '',
        date: date || new Date().toISOString().slice(0, 10),
      })
      return {
        content: [{ type: 'text' as const, text: `Added expense: ₹${amount} for ${tags.join(', ')}${note ? ` — ${note}` : ''}` }],
      }
    } catch (err: any) {
      return { content: [{ type: 'text' as const, text: `Failed to add expense: ${err.message}` }], isError: true }
    }
  }
)

mcpServer.tool(
  'list_expenses',
  'List expenses with optional filters',
  {
    from: z.string().optional().describe('Start date in YYYY-MM-DD format'),
    to: z.string().optional().describe('End date in YYYY-MM-DD format'),
    tags: z.string().optional().describe('Comma-separated tags to filter by (e.g. "food,lunch")'),
  },
  async ({ from, to, tags }, extra) => {
    try {
      const userId = extra?.authInfo?.extra?.userId as string | undefined
      if (!userId) return { content: [{ type: 'text' as const, text: 'Not authenticated' }], isError: true }
      const expenses = await listExpenses(userId, {
        from: from || undefined,
        to: to || undefined,
        tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
      })

      if (expenses.length === 0) {
        return { content: [{ type: 'text' as const, text: 'No expenses found.' }] }
      }

      const total = expenses.reduce((s, e) => s + e.amount, 0)
      const lines = expenses.map(e =>
        `₹${e.amount.toFixed(2)}  ${e.date}  [${e.tags.join(', ')}]${e.note ? `  ${e.note}` : ''}`
      )
      const text = `Found ${expenses.length} expense(s), total ₹${total.toFixed(2)}\n\n${lines.join('\n')}`
      return { content: [{ type: 'text' as const, text }] }
    } catch (err: any) {
      return { content: [{ type: 'text' as const, text: `Failed to list expenses: ${err.message}` }], isError: true }
    }
  }
)

mcpServer.tool(
  'get_summary',
  'Get spending summary grouped by tag or month',
  {
    by: z.enum(['tag', 'month']).describe('Group by tag or month'),
    from: z.string().optional().describe('Start date in YYYY-MM-DD format'),
    to: z.string().optional().describe('End date in YYYY-MM-DD format'),
  },
  async ({ by, from, to }, extra) => {
    try {
      const userId = extra?.authInfo?.extra?.userId as string | undefined
      if (!userId) return { content: [{ type: 'text' as const, text: 'Not authenticated' }], isError: true }
      const summary = await getSummary(userId, by, from || undefined, to || undefined)

      if (summary.length === 0) {
        return { content: [{ type: 'text' as const, text: 'No data for the selected period.' }] }
      }

      const total = summary.reduce((s, d) => s + d.total, 0)
      const lines = summary.map(d =>
        `${d.label}: ₹${d.total.toFixed(2)} (${((d.total / total) * 100).toFixed(1)}%)`
      )
      const text = `Total: ₹${total.toFixed(2)}\n\n${lines.join('\n')}`
      return { content: [{ type: 'text' as const, text }] }
    } catch (err: any) {
      return { content: [{ type: 'text' as const, text: `Failed to get summary: ${err.message}` }], isError: true }
    }
  }
)

mcpServer.tool(
  'delete_expense',
  'Delete (soft-delete) an expense by its ID',
  {
    id: z.string().describe('The ID of the expense to delete'),
  },
  async ({ id }, extra) => {
    try {
      const userId = extra?.authInfo?.extra?.userId as string | undefined
      if (!userId) return { content: [{ type: 'text' as const, text: 'Not authenticated' }], isError: true }
      await deleteExpense(userId, id)
      return { content: [{ type: 'text' as const, text: `Deleted expense ${id}` }] }
    } catch (err: any) {
      if (err.message === 'NOT_FOUND') {
        return { content: [{ type: 'text' as const, text: `Expense not found: ${id}` }], isError: true }
      }
      return { content: [{ type: 'text' as const, text: `Failed to delete expense: ${err.message}` }], isError: true }
    }
  }
)

const BASE_URL = process.env.PUBLIC_URL || `http://localhost:${parseInt(process.env.PORT || '3001', 10)}`
const metadataUrl = getOAuthProtectedResourceMetadataUrl(new URL(`${BASE_URL}/mcp`))

export const mcpAuthMiddleware = requireBearerAuth({
  verifier: { verifyAccessToken: verifyMcpToken },
  requiredScopes: [],
  resourceMetadataUrl: metadataUrl,
})

export async function handleMcpRequest(req: Request, res: Response) {
  const transport = new StreamableHTTPServerTransport({
    sessionIdGenerator: undefined,
    enableJsonResponse: true,
  })
  try {
    if (!(req as any).auth?.extra?.userId) {
      res.status(401).json({ error: 'User ID not found in token' })
      return
    }
    await mcpServer.connect(transport)
    await transport.handleRequest(req, res, req.body)
    await mcpServer.close()
  } catch (err: any) {
    console.error('MCP handler error:', err)
    if (!res.headersSent) {
      res.status(500).json({ error: 'server_error', error_description: err.message })
    }
  }
}
