import { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native'
import { TagInput } from '../../../components/ui/tag-input'
import { Button } from '../../../components/ui/button'
import { api } from '../../../services/api'

interface ExpenseFormProps {
  onExpenseAdded: () => void
  onError: (msg: string) => void
}

export function ExpenseForm({ onExpenseAdded, onError }: ExpenseFormProps) {
  const [amount, setAmount] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [note, setNote] = useState('')
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10))
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => { api.listTags().then(setSuggestions).catch(() => {}) }, [])

  const handleSubmit = async () => {
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) return
    setSubmitting(true)
    try {
      await api.createExpense({ amount: numAmount, tags, note, date })
      setAmount('')
      setTags([])
      setNote('')
      setDate(new Date().toISOString().slice(0, 10))
      onExpenseAdded()
    } catch (err: any) {
      onError(err?.message || 'Failed to add expense')
    }
    setSubmitting(false)
  }

  return (
    <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <View style={styles.card}>
        <View style={styles.row}>
          <View style={styles.amountField}>
            <Text style={styles.label}>AMOUNT (₹)</Text>
            <TextInput
              value={amount}
              onChangeText={setAmount}
              placeholder="0.00"
              keyboardType="decimal-pad"
              style={styles.amountInput}
              placeholderTextColor="#8E8E93"
            />
          </View>
          <View style={styles.dateField}>
            <Text style={styles.label}>DATE</Text>
            <TextInput
              value={date}
              onChangeText={setDate}
              placeholder="2024-01-01"
              style={styles.dateInput}
              placeholderTextColor="#8E8E93"
            />
          </View>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitting || !amount}
            style={[styles.addButton, (submitting || !amount) && styles.addButtonDisabled]}
            activeOpacity={0.7}
          >
            <Text style={styles.addButtonText}>{submitting ? '...' : 'Add'}</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>TAGS</Text>
          <TagInput tags={tags} suggestions={suggestions} onChange={setTags} />
        </View>
        <View style={styles.field}>
          <Text style={styles.label}>NOTE</Text>
          <TextInput
            value={note}
            onChangeText={setNote}
            placeholder="Optional note..."
            style={styles.noteInput}
            placeholderTextColor="#8E8E93"
          />
        </View>
      </View>
    </KeyboardAvoidingView>
  )
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-end',
  },
  amountField: {
    flex: 1,
  },
  dateField: {
    width: 120,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  amountInput: {
    borderWidth: 1,
    borderColor: '#E8E8ED',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 22,
    fontWeight: '700',
    color: '#000000',
    backgroundColor: '#F9F9F9',
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#E8E8ED',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 15,
    color: '#000000',
    backgroundColor: '#F9F9F9',
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 11,
    borderRadius: 10,
    minWidth: 60,
    alignItems: 'center',
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  field: {
    marginTop: 12,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: '#E8E8ED',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: '#000000',
    backgroundColor: '#F9F9F9',
  },
})
