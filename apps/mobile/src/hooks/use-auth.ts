import { useState, useEffect, useCallback } from 'react'
import { isAuthenticated, getToken, setToken, clearToken, getUserInfo, setUserInfo } from '../services/auth'
import { api } from '../services/api'
import { signInWithGoogle } from '../services/auth'

export function useAuth() {
  const [token, setTokenState] = useState<string | null>(null)
  const [user, setUser] = useState<{ id: string; email: string } | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    ;(async () => {
      const t = await getToken()
      setTokenState(t)
      if (t) {
        const u = await getUserInfo()
        if (u) setUser(u)
        else {
          try {
            const me = await api.getMe()
            setUser(me)
            await setUserInfo(me)
          } catch {}
        }
      }
      setLoading(false)
    })()
  }, [])

  const signIn = useCallback(async () => {
    const t = await signInWithGoogle()
    if (t) {
      await setToken(t)
      setTokenState(t)
      try {
        const me = await api.getMe()
        setUser(me)
        await setUserInfo(me)
      } catch {}
      return true
    }
    return false
  }, [])

  const signOut = useCallback(async () => {
    await clearToken()
    setTokenState(null)
    setUser(null)
  }, [])

  return { token, user, loading, isLoggedIn: !!token, signIn, signOut }
}
