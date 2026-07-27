import * as SecureStore from 'expo-secure-store'
import * as WebBrowser from 'expo-web-browser'
import { makeRedirectUri } from 'expo-auth-session'
import { API_URL } from '../utils/env'

const TOKEN_KEY = 'auth_token'
const USER_KEY = 'user_info'

export async function getToken(): Promise<string | null> {
  return SecureStore.getItemAsync(TOKEN_KEY)
}

export async function setToken(token: string): Promise<void> {
  await SecureStore.setItemAsync(TOKEN_KEY, token)
}

export async function clearToken(): Promise<void> {
  await SecureStore.deleteItemAsync(TOKEN_KEY)
  await SecureStore.deleteItemAsync(USER_KEY)
}

export async function isAuthenticated(): Promise<boolean> {
  const token = await getToken()
  return !!token
}

export async function getUserInfo(): Promise<{ id: string; email: string } | null> {
  try {
    const stored = await SecureStore.getItemAsync(USER_KEY)
    return stored ? JSON.parse(stored) : null
  } catch {
    return null
  }
}

export async function setUserInfo(info: { id: string; email: string }): Promise<void> {
  await SecureStore.setItemAsync(USER_KEY, JSON.stringify(info))
}

export async function signInWithGoogle(): Promise<string | null> {
  const redirectUri = makeRedirectUri({
    scheme: 'expenseapp',
    path: 'auth/callback',
  })

  const result = await WebBrowser.openAuthSessionAsync(
    `${API_URL}/auth/google?redirect_uri=${encodeURIComponent(redirectUri)}`,
    redirectUri,
  )

  if (result.type === 'success') {
    const url = new URL(result.url)
    const token = url.searchParams.get('token')
    return token
  }

  return null
}

export async function signOut(): Promise<void> {
  await clearToken()
}
