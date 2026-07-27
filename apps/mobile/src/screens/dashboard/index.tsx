import { useState, useCallback, useEffect } from 'react'
import { View, ScrollView, StyleSheet, ActivityIndicator, Text, RefreshControl, TouchableOpacity, Platform } from 'react-native'
import { ExpenseForm } from './components/expense-form'
import { ExpenseList } from './components/expense-list'
import { ExpenseFilters } from './components/expense-filters'
import { ExpenseEditModal } from './components/expense-edit-modal'
import { CurrentMonthTotal } from './components/current-month-total'
import { PaymentCaptureModal, usePaymentCapture } from './components/payment-capture-sheet'
import { Toast, useToastState } from '../../components/ui/toast'
import { useExpenses, useDeleteExpense } from '../../hooks/use-expenses'
import { useTags } from '../../hooks/use-tags'
import type { ExpenseResponse } from '../../services/api'

export function DashboardScreen() {
  const [filters, setFilters] = useState<{ from?: string; to?: string; tags?: string }>({})
  const [editingExpense, setEditingExpense] = useState<ExpenseResponse | null>(null)
  const { data: expenses, isLoading, refetch } = useExpenses(filters)
  const { data: allTags } = useTags()
  const deleteMutation = useDeleteExpense()
  const { toast, showToast, dismissToast } = useToastState()

  const handleFilter = useCallback((f: { from?: string; to?: string; tags?: string[] }) => {
    setFilters({
      from: f.from,
      to: f.to,
      tags: f.tags?.join(','),
    })
  }, [])

  const handleDelete = async (id: string) => {
    try {
      await deleteMutation.mutateAsync(id)
      showToast('Expense deleted', 'success')
    } catch (err: any) {
      showToast(err?.message || 'Failed to delete', 'error')
    }
  }

  const { pendingPayment, setPendingPayment, setupCapture } = usePaymentCapture(
    () => { refetch(); showToast('Expense auto-added', 'success') },
    (msg) => showToast(msg, 'error'),
  )

  return (
    <View style={styles.container}>
      <Toast message={toast?.message || ''} type={toast?.type || 'success'} visible={!!toast} onDismiss={dismissToast} />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        refreshControl={<RefreshControl refreshing={isLoading} onRefresh={refetch} />}
      >
        <Text style={styles.heading}>Dashboard</Text>
        <ExpenseForm onExpenseAdded={() => { refetch(); showToast('Expense added', 'success') }} onError={(msg) => showToast(msg, 'error')} />
        <CurrentMonthTotal expenses={expenses || []} />
        {allTags && <ExpenseFilters tags={allTags} onFilter={handleFilter} />}

        {Platform.OS === 'android' && (
          <TouchableOpacity style={styles.captureButton} onPress={setupCapture} activeOpacity={0.7}>
            <Text style={styles.captureIcon}>🔔</Text>
            <View>
              <Text style={styles.captureTitle}>Auto-capture Payments</Text>
              <Text style={styles.captureSub}>Detect UPI/banking notifications</Text>
            </View>
          </TouchableOpacity>
        )}

        <View style={styles.listSection}>
          <View style={styles.listHeader}>
            <Text style={styles.listHeaderDate}>Date</Text>
            <Text style={styles.listHeaderAmount}>Amount</Text>
            <Text style={styles.listHeaderTags}>Tags</Text>
            <Text style={styles.listHeaderAction} />
          </View>
          {isLoading ? (
            <ActivityIndicator style={styles.loader} />
          ) : (
            <ExpenseList
              expenses={expenses || []}
              onEdit={setEditingExpense}
              onDelete={handleDelete}
            />
          )}
        </View>
      </ScrollView>
      <ExpenseEditModal
        expense={editingExpense}
        onClose={() => setEditingExpense(null)}
        onUpdated={() => { refetch(); showToast('Expense updated', 'success') }}
        onError={(msg) => showToast(msg, 'error')}
      />
      <PaymentCaptureModal
        payment={pendingPayment}
        onClose={() => setPendingPayment(null)}
        onAdded={() => { refetch(); showToast('Expense added from notification', 'success') }}
        onError={(msg) => showToast(msg, 'error')}
      />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F2F2F7',
  },
  content: {
    padding: 16,
    gap: 16,
    paddingBottom: 32,
  },
  heading: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
  },
  captureButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  captureIcon: {
    fontSize: 28,
  },
  captureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000000',
  },
  captureSub: {
    fontSize: 13,
    color: '#8E8E93',
    marginTop: 2,
  },
  listSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  listHeader: {
    flexDirection: 'row',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8ED',
    gap: 12,
  },
  listHeaderDate: {
    width: 100,
    fontSize: 11,
    fontWeight: '600',
    color: '#8E8E93',
    letterSpacing: 0.5,
  },
  listHeaderAmount: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: '#8E8E93',
    letterSpacing: 0.5,
  },
  listHeaderTags: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: '#8E8E93',
    letterSpacing: 0.5,
  },
  listHeaderAction: {
    width: 40,
  },
  loader: {
    paddingVertical: 24,
  },
})
