import { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal as RNModal, KeyboardAvoidingView, Platform } from 'react-native'
import { TagInput } from '../../../components/ui/tag-input'
import { api, type ExpenseResponse } from '../../../services/api'

interface ExpenseEditModalProps {
  expense: ExpenseResponse | null
  onClose: () => void
  onUpdated: () => void
  onError: (msg: string) => void
}

export function ExpenseEditModal({ expense, onClose, onUpdated, onError }: ExpenseEditModalProps) {
  const [amount, setAmount] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [note, setNote] = useState('')
  const [date, setDate] = useState('')
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (expense) {
      setAmount(expense.amount.toString())
      setTags(expense.tags)
      setNote(expense.note)
      setDate(expense.date)
    }
  }, [expense])

  useEffect(() => { api.listTags().then(setSuggestions).catch(() => {}) }, [])

  const handleSubmit = async () => {
    if (!expense) return
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) return
    setSubmitting(true)
    try {
      await api.updateExpense(expense.id, { amount: numAmount, tags, note, date })
      onUpdated()
      onClose()
    } catch (err: any) {
      onError(err?.message || 'Failed to update expense')
    }
    setSubmitting(false)
  }

  return (
    <RNModal visible={!!expense} animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Edit Expense</Text>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.form}>
          <View style={styles.row}>
            <View style={styles.amountField}>
              <Text style={styles.label}>AMOUNT (₹)</Text>
              <TextInput value={amount} onChangeText={setAmount} keyboardType="decimal-pad" style={styles.input} />
            </View>
            <View style={styles.dateField}>
              <Text style={styles.label}>DATE</Text>
              <TextInput value={date} onChangeText={setDate} style={styles.input} />
            </View>
          </View>
          <View>
            <Text style={styles.label}>TAGS</Text>
            <TagInput tags={tags} suggestions={suggestions} onChange={setTags} />
          </View>
          <View>
            <Text style={styles.label}>NOTE</Text>
            <TextInput value={note} onChangeText={setNote} placeholder="Optional note..." style={styles.input} placeholderTextColor="#8E8E93" />
          </View>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitting}
            style={[styles.saveButton, submitting && styles.saveButtonDisabled]}
            activeOpacity={0.7}
          >
            <Text style={styles.saveButtonText}>{submitting ? 'Saving...' : 'Save'}</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </RNModal>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8ED',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
  },
  cancelText: {
    fontSize: 17,
    color: '#007AFF',
  },
  form: {
    padding: 16,
    gap: 16,
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  amountField: {
    flex: 1,
  },
  dateField: {
    width: 140,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#E8E8ED',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: '#000000',
    backgroundColor: '#FFFFFF',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
})
