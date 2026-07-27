import { TextInput as RNTextInput, StyleSheet, View, Text } from 'react-native'

interface InputProps {
  value: string
  onChangeText: (text: string) => void
  placeholder?: string
  label?: string
  keyboardType?: 'default' | 'numeric' | 'decimal-pad'
  multiline?: boolean
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters'
}

export function Input({ value, onChangeText, placeholder, label, keyboardType, multiline, autoCapitalize }: InputProps) {
  return (
    <View style={styles.wrapper}>
      {label && <Text style={styles.label}>{label}</Text>}
      <RNTextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        keyboardType={keyboardType}
        multiline={multiline}
        autoCapitalize={autoCapitalize}
        style={[styles.input, multiline && styles.multiline]}
        placeholderTextColor="#8E8E93"
      />
    </View>
  )
}

const styles = StyleSheet.create({
  wrapper: {
    marginBottom: 4,
  },
  label: {
    fontSize: 13,
    fontWeight: '600',
    color: '#3C3C43',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    borderWidth: 1,
    borderColor: '#C6C6C8',
    borderRadius: 10,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 17,
    color: '#000000',
    backgroundColor: '#FFFFFF',
  },
  multiline: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
})
