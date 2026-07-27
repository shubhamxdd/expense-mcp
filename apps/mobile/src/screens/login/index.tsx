import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native'

interface LoginScreenProps {
  onSignIn: () => Promise<boolean | undefined>
}

export function LoginScreen({ onSignIn }: LoginScreenProps) {
  const [loading, setLoading] = React.useState(false)

  const handleSignIn = async () => {
    setLoading(true)
    try { await onSignIn() } finally { setLoading(false) }
  }

  return (
    <View style={styles.container}>
      <View style={styles.card}>
        <Text style={styles.title}>Expense Tracker</Text>
        <Text style={styles.subtitle}>Sign in to manage your expenses</Text>
        <TouchableOpacity style={styles.googleButton} onPress={handleSignIn} disabled={loading} activeOpacity={0.7}>
          {loading ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.googleButtonText}>Sign in with Google</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
  )
}

import React from 'react'

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F2F2F7',
    padding: 24,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 3,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#000000',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: '#8E8E93',
    marginBottom: 32,
    textAlign: 'center',
  },
  googleButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 14,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  googleButtonText: {
    color: '#FFFFFF',
    fontSize: 17,
    fontWeight: '600',
  },
})
