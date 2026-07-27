import { useState, useEffect } from 'react'
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView } from 'react-native'

interface ExpenseFiltersProps {
  tags: string[]
  onFilter: (filters: { from?: string; to?: string; tags?: string[] }) => void
}

export function ExpenseFilters({ tags, onFilter }: ExpenseFiltersProps) {
  const [from, setFrom] = useState('')
  const [to, setTo] = useState('')
  const [selectedTags, setSelectedTags] = useState<string[]>([])
  const [expanded, setExpanded] = useState(false)

  useEffect(() => {
    onFilter({ from: from || undefined, to: to || undefined, tags: selectedTags.length ? selectedTags : undefined })
  }, [from, to, selectedTags])

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag])
  }

  const hasActiveFilters = from || to || selectedTags.length

  return (
    <View>
      <TouchableOpacity style={styles.toggle} onPress={() => setExpanded(!expanded)} activeOpacity={0.7}>
        <Text style={styles.toggleText}>Filters{hasActiveFilters ? ' •' : ''}</Text>
      </TouchableOpacity>
      {expanded && (
        <View style={styles.panel}>
          <View style={styles.dateRow}>
            <View style={styles.dateField}>
              <Text style={styles.label}>From</Text>
              <TextInput value={from} onChangeText={setFrom} placeholder="YYYY-MM-DD" style={styles.dateInput} placeholderTextColor="#8E8E93" />
            </View>
            <View style={styles.dateField}>
              <Text style={styles.label}>To</Text>
              <TextInput value={to} onChangeText={setTo} placeholder="YYYY-MM-DD" style={styles.dateInput} placeholderTextColor="#8E8E93" />
            </View>
          </View>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.tagRow}>
            {tags.map(tag => (
              <TouchableOpacity
                key={tag}
                onPress={() => toggleTag(tag)}
                style={[styles.tagChip, selectedTags.includes(tag) && styles.tagChipActive]}
                activeOpacity={0.7}
              >
                <Text style={[styles.tagChipText, selectedTags.includes(tag) && styles.tagChipTextActive]}>{tag}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {hasActiveFilters && (
            <TouchableOpacity onPress={() => { setFrom(''); setTo(''); setSelectedTags([]) }} style={styles.clearButton}>
              <Text style={styles.clearText}>Clear filters</Text>
            </TouchableOpacity>
          )}
        </View>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  toggle: {
    paddingVertical: 8,
  },
  toggleText: {
    fontSize: 15,
    color: '#007AFF',
    fontWeight: '500',
  },
  panel: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 14,
    gap: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.08,
    shadowRadius: 6,
    elevation: 2,
  },
  dateRow: {
    flexDirection: 'row',
    gap: 12,
  },
  dateField: {
    flex: 1,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    color: '#8E8E93',
    marginBottom: 4,
    letterSpacing: 0.5,
  },
  dateInput: {
    borderWidth: 1,
    borderColor: '#E8E8ED',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 15,
    color: '#000000',
    backgroundColor: '#F9F9F9',
  },
  tagRow: {
    flexDirection: 'row',
  },
  tagChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F2F2F7',
    marginRight: 6,
    borderWidth: 1,
    borderColor: '#E8E8ED',
  },
  tagChipActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  tagChipText: {
    fontSize: 14,
    color: '#3C3C43',
  },
  tagChipTextActive: {
    color: '#FFFFFF',
  },
  clearButton: {
    alignSelf: 'flex-start',
  },
  clearText: {
    fontSize: 14,
    color: '#FF3B30',
  },
})
