import { View, Text, StyleSheet, FlatList, TouchableOpacity, Alert, Platform } from 'react-native'
import { formatCurrency, formatDateShort } from '../../../utils/format'
import type { ExpenseResponse } from '../../../services/api'

const monoFont = Platform.OS === 'ios' ? 'Menlo' : 'monospace'

interface ExpenseListProps {
  expenses: ExpenseResponse[]
  onEdit: (expense: ExpenseResponse) => void
  onDelete: (id: string) => void
}

export function ExpenseList({ expenses, onEdit, onDelete }: ExpenseListProps) {
  if (expenses.length === 0) {
    return <Text style={styles.empty}>No expenses yet.</Text>
  }

  return (
    <FlatList
      data={expenses}
      keyExtractor={item => item.id}
      renderItem={({ item }) => (
        <View style={styles.row}>
          <View style={styles.left}>
            <Text style={styles.date}>{formatDateShort(item.date)}</Text>
            <Text style={styles.amount}>{formatCurrency(item.amount)}</Text>
          </View>
          <View style={styles.center}>
            <View style={styles.tags}>
              {item.tags.map(tag => (
                <View key={tag} style={styles.tag}>
                  <Text style={styles.tagText}>{tag}</Text>
                </View>
              ))}
            </View>
            {item.note ? <Text style={styles.note} numberOfLines={1}>{item.note}</Text> : null}
          </View>
          <View style={styles.actions}>
            <TouchableOpacity onPress={() => onEdit(item)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.editIcon}>✎</Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={() => {
                Alert.alert('Delete Expense', 'Are you sure?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: () => onDelete(item.id) },
                ])
              }}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <Text style={styles.deleteIcon}>🗑</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      ItemSeparatorComponent={() => <View style={styles.separator} />}
      scrollEnabled={false}
    />
  )
}

const styles = StyleSheet.create({
  empty: {
    textAlign: 'center',
    color: '#8E8E93',
    fontSize: 15,
    paddingVertical: 24,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  left: {
    width: 100,
  },
  date: {
    fontSize: 13,
    color: '#8E8E93',
    fontFamily: monoFont,
  },
  amount: {
    fontSize: 17,
    fontWeight: '700',
    color: '#000000',
    fontFamily: monoFont,
  },
  center: {
    flex: 1,
    gap: 4,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
  },
  tag: {
    backgroundColor: '#E8E8ED',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
  },
  tagText: {
    fontSize: 12,
    color: '#3C3C43',
  },
  note: {
    fontSize: 13,
    color: '#8E8E93',
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  editIcon: {
    fontSize: 16,
    color: '#007AFF',
  },
  deleteIcon: {
    fontSize: 16,
  },
  separator: {
    height: 1,
    backgroundColor: '#E8E8ED',
  },
})
