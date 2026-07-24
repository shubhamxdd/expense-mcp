import { NavLink } from 'react-router-dom'
import { BarChart3, Home, Settings, User } from 'lucide-react'

export default function Navbar() {
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-[2px] transition-colors ${
      isActive ? 'bg-accent-ink text-white' : 'text-text-primary hover:bg-bg-hover'
    }`

  return (
    <nav className="flex items-center justify-between px-6 py-3 border-b border-border-default bg-bg-base">
      <NavLink to="/" className="text-xl font-heading text-text-primary no-underline">
        Expense Tracker
      </NavLink>
      <div className="flex items-center gap-2">
        <NavLink to="/" end className={linkClass}>
          <Home size={16} /> Dashboard
        </NavLink>
        <NavLink to="/summary" className={linkClass}>
          <BarChart3 size={16} /> Summary
        </NavLink>
        <NavLink to="/settings" className={linkClass}>
          <Settings size={16} /> Settings
        </NavLink>
        <div className="ml-2 pl-2 border-l border-border-default">
          <div className="flex items-center gap-1.5 text-text-muted text-sm">
            <User size={16} />
            <span className="font-sans">Ravi</span>
          </div>
        </div>
      </div>
    </nav>
  )
}