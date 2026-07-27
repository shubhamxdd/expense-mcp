import { TouchableOpacity, Text, StyleSheet, type ViewStyle } from 'react-native'

interface ButtonProps {
  title: string
  onPress: () => void
  variant?: 'primary' | 'outline' | 'ghost'
  disabled?: boolean
  loading?: boolean
  style?: ViewStyle
}

export function Button({ title, onPress, variant = 'primary', disabled, loading, style }: ButtonProps) {
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={disabled || loading}
      style={[styles.base, styles[variant], disabled && styles.disabled, style]}
      activeOpacity={0.7}
    >
      <Text style={[styles.text, variant === 'outline' && styles.outlineText, variant === 'ghost' && styles.ghostText]}>
        {loading ? '...' : title}
      </Text>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: '#007AFF',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#007AFF',
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  disabled: {
    opacity: 0.5,
  },
  text: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  outlineText: {
    color: '#007AFF',
  },
  ghostText: {
    color: '#007AFF',
  },
})
