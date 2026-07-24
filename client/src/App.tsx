import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Navbar from './components/Navbar'
import Dashboard from './pages/Dashboard'
import Summary from './pages/Summary'
import Settings from './pages/Settings'
import Login from './pages/Login'

export default function App() {
  const isLoggedIn = true

  if (!isLoggedIn) {
    return (
      <BrowserRouter>
        <Routes>
          <Route path="*" element={<Login />} />
        </Routes>
      </BrowserRouter>
    )
  }

  return (
    <BrowserRouter>
      <Navbar />
      <Routes>
        <Route path="/" element={<Dashboard />} />
        <Route path="/summary" element={<Summary />} />
        <Route path="/settings" element={<Settings />} />
      </Routes>
    </BrowserRouter>
  )
}