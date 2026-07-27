import { View, Text, StyleSheet } from 'react-native'
import { formatCurrency } from '../../../utils/format'
import type { ExpenseResponse } from '../../../services/api'

interface CurrentMonthTotalProps {
  expenses: ExpenseResponse[]
}

export function CurrentMonthTotal({ expenses }: CurrentMonthTotalProps) {
  const now = new Date()
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10)
  const monthEnd = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().slice(0, 10)
  const total = expenses
    .filter(e => e.date >= monthStart && e.date <= monthEnd)
    .reduce((sum, e) => sum + e.amount, 0)

  return (
    <View style={styles.card}>
      <Text style={styles.label}>Current Month Total</Text>
      <Text style={styles.amount}>{formatCurrency(total)}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#007AFF',
    borderRadius: 14,
    padding: 16,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#FFFFFF',
    opacity: 0.8,
    letterSpacing: 0.5,
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  amount: {
    fontSize: 28,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Menlo',
  },
})
