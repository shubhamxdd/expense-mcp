import { useState } from 'react'
import { View, Text, TextInput, TouchableOpacity, ScrollView, StyleSheet, ActivityIndicator } from 'react-native'
import { SummaryChart } from './components/summary-chart'
import { useSummary } from '../../hooks/use-summary'
import { formatCurrency } from '../../utils/format'

export function SummaryScreen() {
  const [by, setBy] = useState<'tag' | 'month'>('tag')
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const { data, isLoading } = useSummary(by, from || undefined, to || undefined)

  const grandTotal = (data || []).reduce((s, d) => s + d.total, 0)

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <Text style={styles.heading}>Summary</Text>

      <View style={styles.controls}>
        <View style={styles.toggle}>
          <TouchableOpacity
            onPress={() => setBy('tag')}
            style={[styles.toggleButton, by === 'tag' && styles.toggleButtonActive]}
          >
            <Text style={[styles.toggleText, by === 'tag' && styles.toggleTextActive]}>By Tag</Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setBy('month')}
            style={[styles.toggleButton, by === 'month' && styles.toggleButtonActive]}
          >
            <Text style={[styles.toggleText, by === 'month' && styles.toggleTextActive]}>By Month</Text>
          </TouchableOpacity>
        </View>
        <View style={styles.dateRow}>
          <TextInput value={from} onChangeText={setFrom} placeholder="From (YYYY-MM-DD)" style={styles.dateInput} placeholderTextColor="#8E8E93" />
          <Text style={styles.dateSep}>to</Text>
          <TextInput value={to} onChangeText={setTo} placeholder="To (YYYY-MM-DD)" style={styles.dateInput} placeholderTextColor="#8E8E93" />
        </View>
      </View>

      {isLoading ? (
        <ActivityIndicator style={styles.loader} />
      ) : !data || data.length === 0 ? (
        <Text style={styles.empty}>No data for the selected period.</Text>
      ) : (
        <>
          <SummaryChart data={data} type="bar" title={by === 'tag' ? 'Totals by Tag' : 'Totals by Month'} />
          <SummaryChart data={data} type="pie" title="Distribution" />
          <View style={styles.table}>
            <View style={styles.tableHeader}>
              <Text style={styles.tableHeaderLabel}>{by === 'tag' ? 'Tag' : 'Month'}</Text>
              <Text style={styles.tableHeaderTotal}>Total</Text>
            </View>
            {data.map(d => (
              <View key={d.label} style={styles.tableRow}>
                <Text style={styles.tableLabel}>{d.label}</Text>
                <Text style={styles.tableValue}>{formatCurrency(d.total)}</Text>
              </View>
            ))}
            <View style={[styles.tableRow, styles.tableTotalRow]}>
              <Text style={[styles.tableLabel, styles.tableTotalLabel]}>Total</Text>
              <Text style={[styles.tableValue, styles.tableTotalValue]}>{formatCurrency(grandTotal)}</Text>
            </View>
          </View>
        </>
      )}
    </ScrollView>
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
  controls: {
    gap: 12,
  },
  toggle: {
    flexDirection: 'row',
    backgroundColor: '#E8E8ED',
    borderRadius: 10,
    padding: 2,
  },
  toggleButton: {
    flex: 1,
    paddingVertical: 8,
    alignItems: 'center',
    borderRadius: 8,
  },
  toggleButtonActive: {
    backgroundColor: '#FFFFFF',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  toggleText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#8E8E93',
  },
  toggleTextActive: {
    color: '#000000',
    fontWeight: '600',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dateInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#E8E8ED',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#000000',
    backgroundColor: '#FFFFFF',
  },
  dateSep: {
    fontSize: 14,
    color: '#8E8E93',
  },
  loader: {
    paddingVertical: 48,
  },
  empty: {
    textAlign: 'center',
    color: '#8E8E93',
    fontSize: 15,
    paddingVertical: 48,
  },
  table: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 2,
  },
  tableHeader: {
    flexDirection: 'row',
    paddingBottom: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#E8E8ED',
  },
  tableHeaderLabel: {
    flex: 1,
    fontSize: 11,
    fontWeight: '600',
    color: '#8E8E93',
    letterSpacing: 0.5,
  },
  tableHeaderTotal: {
    width: 120,
    textAlign: 'right',
    fontSize: 11,
    fontWeight: '600',
    color: '#8E8E93',
    letterSpacing: 0.5,
  },
  tableRow: {
    flexDirection: 'row',
    paddingVertical: 10,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E8E8ED',
  },
  tableLabel: {
    flex: 1,
    fontSize: 15,
    color: '#3C3C43',
  },
  tableValue: {
    width: 120,
    textAlign: 'right',
    fontSize: 15,
    color: '#000000',
    fontWeight: '600',
    fontFamily: 'Menlo',
  },
  tableTotalRow: {
    borderBottomWidth: 0,
    marginTop: 4,
  },
  tableTotalLabel: {
    fontWeight: '700',
    color: '#000000',
  },
  tableTotalValue: {
    fontWeight: '700',
  },
})
