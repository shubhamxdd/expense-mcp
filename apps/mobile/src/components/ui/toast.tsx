import { useEffect, useRef } from 'react'
import { Animated, Text, StyleSheet } from 'react-native'

interface ToastProps {
  message: string
  type: 'success' | 'error'
  visible: boolean
  onDismiss: () => void
}

export function Toast({ message, type, visible, onDismiss }: ToastProps) {
  const opacity = useRef(new Animated.Value(0)).current

  useEffect(() => {
    if (visible) {
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 200, useNativeDriver: true }),
        Animated.delay(3000),
        Animated.timing(opacity, { toValue: 0, duration: 200, useNativeDriver: true }),
      ]).start(() => onDismiss())
    }
  }, [visible])

  if (!visible) return null

  return (
    <Animated.View style={[styles.container, { opacity }, type === 'error' ? styles.error : styles.success]}>
      <Text style={styles.text}>{message}</Text>
    </Animated.View>
  )
}

export function useToastState() {
  const [toast, setToast] = React.useState<{ message: string; type: 'success' | 'error' } | null>(null)
  return {
    toast,
    showToast: (message: string, type: 'success' | 'error' = 'success') => setToast({ message, type }),
    dismissToast: () => setToast(null),
  }
}

import React from 'react'

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60,
    left: 16,
    right: 16,
    padding: 16,
    borderRadius: 12,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
  success: {
    backgroundColor: '#34C759',
  },
  error: {
    backgroundColor: '#FF3B30',
  },
  text: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '600',
    textAlign: 'center',
  },
})
