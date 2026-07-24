import { Router } from 'express'
import { z } from 'zod'
import { authMiddleware } from '../middleware/auth.js'
import { validate } from '../middleware/validate.js'

const router = Router()
router.use(authMiddleware)

const createExpenseSchema = z.object({
  date: z.string().optional(),
  amount: z.number().positive(),
  tags: z.array(z.string()).default([]),
  note: z.string().optional(),
})

const updateExpenseSchema = z.object({
  date: z.string().optional(),
  amount: z.number().positive().optional(),
  tags: z.array(z.string()).optional(),
  note: z.string().optional(),
})

router.get('/', async (req, res) => {
  try {
    const { from, to, tags } = req.query
    const tagsArr = typeof tags === 'string' ? tags.split(',') : undefined
    const { listExpenses } = await import('../services/expenseService.js')
    const expenses = await listExpenses(req.user!.userId, {
      from: from as string | undefined,
      to: to as string | undefined,
      tags: tagsArr,
    })
    res.json({ data: expenses })
  } catch (err: any) {
    console.error('Error listing expenses:', err)
    res.status(500).json({ error: { message: err.message || 'Failed to list expenses', code: 'INTERNAL_ERROR' } })
  }
})

router.post('/', validate(createExpenseSchema), async (req, res) => {
  try {
    const { addExpense } = await import('../services/expenseService.js')
    const expense = await addExpense(req.user!.userId, {
      date: req.body.date || new Date().toISOString().slice(0, 10),
      amount: req.body.amount,
      tags: req.body.tags,
      note: req.body.note || '',
    })
    res.status(201).json({ data: expense })
  } catch (err: any) {
    console.error('Error creating expense:', err)
    res.status(500).json({ error: { message: err.message || 'Failed to create expense', code: 'INTERNAL_ERROR' } })
  }
})

router.put('/:id', validate(updateExpenseSchema), async (req, res) => {
  try {
    const { updateExpense } = await import('../services/expenseService.js')
    const expense = await updateExpense(req.user!.userId, req.params.id as string, req.body)
    res.json({ data: expense })
  } catch (err: any) {
    if (err.message === 'NOT_FOUND') {
      res.status(404).json({ error: { message: 'Expense not found', code: 'NOT_FOUND' } })
      return
    }
    console.error('Error updating expense:', err)
    res.status(500).json({ error: { message: err.message || 'Failed to update expense', code: 'INTERNAL_ERROR' } })
  }
})

router.delete('/:id', async (req, res) => {
  try {
    const { deleteExpense } = await import('../services/expenseService.js')
    await deleteExpense(req.user!.userId, req.params.id as string)
    res.json({ data: { success: true } })
  } catch (err: any) {
    if (err.message === 'NOT_FOUND') {
      res.status(404).json({ error: { message: 'Expense not found', code: 'NOT_FOUND' } })
      return
    }
    console.error('Error deleting expense:', err)
    res.status(500).json({ error: { message: err.message || 'Failed to delete expense', code: 'INTERNAL_ERROR' } })
  }
})

export default router