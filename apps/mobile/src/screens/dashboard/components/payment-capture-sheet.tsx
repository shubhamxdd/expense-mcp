import { useState, useEffect, useCallback } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Modal as RNModal, Platform, Alert } from 'react-native'
import { TagInput } from '../../../components/ui/tag-input'
import { Button } from '../../../components/ui/button'
import { api } from '../../../services/api'
import {
  startListening,
  stopListening,
  hasPermission,
  openSettings,
  addPaymentListener,
} from '../../../services/notification-capture'

interface PaymentNotificationData {
  amount: number
  note?: string
  merchant?: string
}

export function usePaymentCapture(onExpenseAdded: () => void, onError: (msg: string) => void) {
  const [pendingPayment, setPendingPayment] = useState<PaymentNotificationData | null>(null)

  useEffect(() => {
    const removeListener = addPaymentListener((event: any) => {
      if (event.amount && event.amount > 0) {
        setPendingPayment({
          amount: event.amount,
          note: event.note,
          merchant: event.merchant,
        })
      }
    })
    return removeListener
  }, [])

  const setupCapture = useCallback(async () => {
    if (Platform.OS !== 'android') {
      Alert.alert('Not Available', 'Auto-capture is only available on Android via notification listening.')
      return
    }
    const granted = await hasPermission()
    if (!granted) {
      Alert.alert(
        'Notification Access Required',
        'To automatically detect payments, please grant notification access to Expense Tracker in Settings.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Open Settings', onPress: () => openSettings() },
        ],
      )
      return
    }
    await startListening()
  }, [])

  return { pendingPayment, setPendingPayment, setupCapture }
}

export function PaymentCaptureModal({
  payment,
  onClose,
  onAdded,
  onError,
}: {
  payment: PaymentNotificationData | null
  onClose: () => void
  onAdded: () => void
  onError: (msg: string) => void
}) {
  const [amount, setAmount] = useState('')
  const [tags, setTags] = useState<string[]>([])
  const [note, setNote] = useState('')
  const [date] = useState(new Date().toISOString().slice(0, 10))
  const [suggestions, setSuggestions] = useState<string[]>([])
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (payment) {
      setAmount(payment.amount.toString())
      setNote(payment.note || payment.merchant || '')
    }
  }, [payment])

  useEffect(() => { api.listTags().then(setSuggestions).catch(() => {}) }, [])

  const handleSubmit = async () => {
    const numAmount = parseFloat(amount)
    if (isNaN(numAmount) || numAmount <= 0) return
    if (tags.length === 0) {
      onError('Please add at least one tag')
      return
    }
    setSubmitting(true)
    try {
      await api.createExpense({ amount: numAmount, tags, note, date })
      onAdded()
      onClose()
    } catch (err: any) {
      onError(err?.message || 'Failed to add expense')
    }
    setSubmitting(false)
  }

  return (
    <RNModal visible={!!payment} animationType="slide" presentationStyle="formSheet" onRequestClose={onClose}>
      <View style={styles.container}>
        <View style={styles.header}>
          <View>
            <Text style={styles.headerTitle}>Add Expense</Text>
            <Text style={styles.headerSub}>Payment detected — add it to a tag</Text>
          </View>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelText}>Skip</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.form}>
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Amount</Text>
            <Text style={styles.amountValue}>₹{amount}</Text>
          </View>
          <View>
            <Text style={styles.label}>TAGS</Text>
            <TagInput tags={tags} suggestions={suggestions} onChange={setTags} placeholder="Select tags..." />
          </View>
          <View>
            <Text style={styles.label}>NOTE</Text>
            <TextInput value={note} onChangeText={setNote} style={styles.input} placeholderTextColor="#8E8E93" />
          </View>
          <TouchableOpacity
            onPress={handleSubmit}
            disabled={submitting || tags.length === 0}
            style={[styles.addButton, (submitting || tags.length === 0) && styles.addButtonDisabled]}
            activeOpacity={0.7}
          >
            <Text style={styles.addButtonText}>{submitting ? 'Adding...' : 'Add Expense'}</Text>
          </TouchableOpacity>
        </View>
      </View>
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
  headerSub: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  cancelText: {
    fontSize: 17,
    color: '#007AFF',
  },
  form: {
    padding: 16,
    gap: 16,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
  },
  amountLabel: {
    fontSize: 16,
    color: '#3C3C43',
  },
  amountValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#000000',
    fontFamily: 'Menlo',
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
  addButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 8,
  },
  addButtonDisabled: {
    opacity: 0.5,
  },
  addButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
})
