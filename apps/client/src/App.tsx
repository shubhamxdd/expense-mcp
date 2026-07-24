import { useEffect, useState } from 'react'
import { BrowserRouter, Routes, Route, useSearchParams } from 'react-router-dom'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import Summary from './pages/Summary'
import Settings from './pages/Settings'
import Login from './pages/Login'
import McpAuth from './pages/McpAuth'
import { isAuthenticated, setToken, clearToken } from './services/api'

function AuthHandler({ onAuth }: { onAuth: () => void }) {
  const [params] = useSearchParams()
  useEffect(() => {
    const token = params.get('token')
    if (token) {
      setToken(token)
      window.history.replaceState({}, '', '/')
      onAuth()
    }
  }, [params, onAuth])
  return null
}

export default function App() {
  const [loggedIn, setLoggedIn] = useState(isAuthenticated())

  const handleLogout = () => {
    clearToken()
    setLoggedIn(false)
  }

  if (!loggedIn) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="/mcp-auth" element={<McpAuth />} />
          <Route path="*" element={<><AuthHandler onAuth={() => setLoggedIn(true)} /><Login /></>} />
        </Routes>
      </BrowserRouter>
    )
  }

  return (
    <BrowserRouter>
      <Navbar onLogout={handleLogout} />
      <Routes>
        <Route path="/mcp-auth" element={<McpAuth />} />
        <Route path="/" element={<Dashboard />} />
        <Route path="/summary" element={<Summary />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </BrowserRouter>
  )
}