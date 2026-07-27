import { useEffect, useState } from 'react'
import { Stack } from 'expo-router/stack'
import { StatusBar } from 'expo-status-bar'
import { View, ActivityIndicator } from 'react-native'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { useAuth } from '../hooks/use-auth'
import { LoginScreen } from '../screens/login'

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2,
      retry: 2,
    },
  },
})

function RootLayoutInner() {
  const { isLoggedIn, loading, signIn } = useAuth()

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F2F2F7' }}>
        <ActivityIndicator size="large" />
      </View>
    )
  }

  if (!isLoggedIn) {
    return <LoginScreen onSignIn={signIn} />
  }

  return (
    <>
      <StatusBar style="dark" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
      </Stack>
    </>
  )
}

export default function RootLayout() {
  return (
    <QueryClientProvider client={queryClient}>
      <RootLayoutInner />
    </QueryClientProvider>
  )
}
