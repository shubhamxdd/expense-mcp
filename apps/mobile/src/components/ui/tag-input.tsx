import { useState, useRef } from 'react'
import { View, TextInput, TouchableOpacity, Text, StyleSheet, ScrollView } from 'react-native'

interface TagInputProps {
  tags: string[]
  suggestions: string[]
  onChange: (tags: string[]) => void
  placeholder?: string
}

export function TagInput({ tags, suggestions, onChange, placeholder = 'Add tag...' }: TagInputProps) {
  const [input, setInput] = useState('')
  const [focused, setFocused] = useState(false)

  const filtered = suggestions.filter(
    s => s.toLowerCase().includes(input.toLowerCase()) && !tags.includes(s),
  )

  const addTag = (tag: string) => {
    const trimmed = tag.trim().toLowerCase()
    if (trimmed && !tags.includes(trimmed)) {
      onChange([...tags, trimmed])
    }
    setInput('')
  }

  const removeTag = (tag: string) => {
    onChange(tags.filter(t => t !== tag))
  }

  const handleSubmitEditing = () => {
    if (input.trim()) addTag(input)
  }

  return (
    <View style={styles.wrapper}>
      <View style={styles.chipContainer}>
        {tags.map(tag => (
          <View key={tag} style={styles.chip}>
            <Text style={styles.chipText}>{tag}</Text>
            <TouchableOpacity onPress={() => removeTag(tag)} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
              <Text style={styles.chipRemove}>✕</Text>
            </TouchableOpacity>
          </View>
        ))}
        <TextInput
          value={input}
          onChangeText={setInput}
          onFocus={() => setFocused(true)}
          onBlur={() => setTimeout(() => setFocused(false), 200)}
          onSubmitEditing={handleSubmitEditing}
          placeholder={tags.length === 0 ? placeholder : ''}
          placeholderTextColor="#8E8E93"
          style={styles.textInput}
          returnKeyType="done"
        />
      </View>
      {focused && input.length > 0 && (
        <ScrollView style={styles.suggestions} keyboardShouldPersistTaps="handled">
          {filtered.map(s => (
            <TouchableOpacity key={s} style={styles.suggestion} onPress={() => addTag(s)}>
              <Text style={styles.suggestionText}>{s}</Text>
            </TouchableOpacity>
          ))}
          {!tags.includes(input.trim().toLowerCase()) && (
            <TouchableOpacity style={styles.suggestion} onPress={() => addTag(input)}>
              <Text style={styles.suggestionNew}>+ "{input.trim().toLowerCase()}"</Text>
            </TouchableOpacity>
          )}
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    position: 'relative',
    zIndex: 10,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 6,
    borderWidth: 1,
    borderColor: '#C6C6C8',
    borderRadius: 10,
    padding: 8,
    backgroundColor: '#FFFFFF',
    minHeight: 44,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#E8E8ED',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  chipText: {
    fontSize: 14,
    color: '#1C1C1E',
  },
  chipRemove: {
    fontSize: 12,
    color: '#8E8E93',
  },
  textInput: {
    flex: 1,
    minWidth: 80,
    fontSize: 16,
    color: '#000000',
    paddingVertical: 4,
  },
  suggestions: {
    position: 'absolute',
    top: '100%',
    left: 0,
    right: 0,
    maxHeight: 200,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#C6C6C8',
    borderRadius: 10,
    marginTop: 4,
    zIndex: 100,
  },
  suggestion: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 0.5,
    borderBottomColor: '#E8E8ED',
  },
  suggestionText: {
    fontSize: 16,
    color: '#000000',
  },
  suggestionNew: {
    fontSize: 16,
    color: '#007AFF',
  },
})
