import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js'
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js'
import { z } from 'zod'

import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname, resolve } from 'path'

import { validateApiKey } from './auth.js'
import { addExpense, listExpenses, getSummary, deleteExpense } from '@expense/expense-service'

const __dirname = dirname(fileURLToPath(import.meta.url))
dotenv.config({ path: resolve(__dirname, '../server/.env') })

const API_KEY = process.env.EXPENSE_API_KEY
if (!API_KEY) {
  console.error('EXPENSE_API_KEY environment variable is required')
  process.exit(1)
}

let userId: string

const server = new McpServer({
  name: 'Expense Tracker',
  version: '1.0.0',
  description: 'Log and query expenses via natural language. Data is stored in your Google Sheet.',
})

server.tool(
  'add_expense',
  'Add a new expense to your Google Sheet',
  {
    amount: z.number().positive().describe('Amount in INR (₹)'),
    tags: z.array(z.string()).describe('Tags/categories for this expense (e.g. ["lunch", "food"])'),
    note: z.string().optional().describe('Optional note or description'),
    date: z.string().optional().describe('Date in YYYY-MM-DD format (defaults to today)'),
  },
  async ({ amount, tags, note, date }) => {
    try {
      const expense = await addExpense(userId, {
        amount,
        tags,
        note: note || '',
        date: date || new Date().toISOString().slice(0, 10),
      })
      return {
        content: [{ type: 'text', text: `✅ Added expense: ₹${amount} for ${tags.join(', ')}${note ? ` — ${note}` : ''}` }],
      }
    } catch (err: any) {
      return { content: [{ type: 'text', text: `❌ Failed to add expense: ${err.message}` }], isError: true }
    }
  }
)

server.tool(
  'list_expenses',
  'List expenses with optional filters',
  {
    from: z.string().optional().describe('Start date in YYYY-MM-DD format'),
    to: z.string().optional().describe('End date in YYYY-MM-DD format'),
    tags: z.string().optional().describe('Comma-separated tags to filter by (e.g. "food,lunch")'),
  },
  async ({ from, to, tags }) => {
    try {
      const expenses = await listExpenses(userId, {
        from: from || undefined,
        to: to || undefined,
        tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : undefined,
      })

      if (expenses.length === 0) {
        return { content: [{ type: 'text', text: 'No expenses found.' }] }
      }

      const total = expenses.reduce((s, e) => s + e.amount, 0)
      const lines = expenses.map(e =>
        `₹${e.amount.toFixed(2)}  ${e.date}  [${e.tags.join(', ')}]${e.note ? `  ${e.note}` : ''}`
      )
      const text = `Found ${expenses.length} expense(s), total ₹${total.toFixed(2)}\n\n${lines.join('\n')}`
      return { content: [{ type: 'text', text }] }
    } catch (err: any) {
      return { content: [{ type: 'text', text: `❌ Failed to list expenses: ${err.message}` }], isError: true }
    }
  }
)

server.tool(
  'get_summary',
  'Get spending summary grouped by tag or month',
  {
    by: z.enum(['tag', 'month']).describe('Group by tag or month'),
    from: z.string().optional().describe('Start date in YYYY-MM-DD format'),
    to: z.string().optional().describe('End date in YYYY-MM-DD format'),
  },
  async ({ by, from, to }) => {
    try {
      const summary = await getSummary(userId, by, from || undefined, to || undefined)

      if (summary.length === 0) {
        return { content: [{ type: 'text', text: 'No data for the selected period.' }] }
      }

      const total = summary.reduce((s, d) => s + d.total, 0)
      const lines = summary.map(d =>
        `${d.label}: ₹${d.total.toFixed(2)} (${((d.total / total) * 100).toFixed(1)}%)`
      )
      const text = `Total: ₹${total.toFixed(2)}\n\n${lines.join('\n')}`
      return { content: [{ type: 'text', text }] }
    } catch (err: any) {
      return { content: [{ type: 'text', text: `❌ Failed to get summary: ${err.message}` }], isError: true }
    }
  }
)

server.tool(
  'delete_expense',
  'Delete (soft-delete) an expense by its ID',
  {
    id: z.string().describe('The ID of the expense to delete'),
  },
  async ({ id }) => {
    try {
      await deleteExpense(userId, id)
      return { content: [{ type: 'text', text: `✅ Deleted expense ${id}` }] }
    } catch (err: any) {
      if (err.message === 'NOT_FOUND') {
        return { content: [{ type: 'text', text: `❌ Expense not found: ${id}` }], isError: true }
      }
      return { content: [{ type: 'text', text: `❌ Failed to delete expense: ${err.message}` }], isError: true }
    }
  }
)

async function main() {
  try {
    userId = await validateApiKey(API_KEY!)
    console.error(`Authenticated user: ${userId}`)

    const transport = new StdioServerTransport()
    await server.connect(transport)
    console.error('MCP server running on stdio')
  } catch (err: any) {
    console.error(`Failed to start MCP server: ${err.message}`)
    process.exit(1)
  }
}

main()
