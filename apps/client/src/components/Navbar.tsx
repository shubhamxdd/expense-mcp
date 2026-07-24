import { useState } from 'react'
import { NavLink } from 'react-router-dom'
import { BarChart3, Home, Settings, User, LogOut, Menu, X } from 'lucide-react'

interface NavbarProps {
  onLogout: () => void
}

export default function Navbar({ onLogout }: NavbarProps) {
  const [mobileOpen, setMobileOpen] = useState(false)

  const linkClass = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-1.5 px-3 py-1.5 text-sm font-medium rounded-[2px] transition-colors ${
      isActive ? 'bg-accent-ink text-white' : 'text-text-primary hover:bg-bg-hover'
    }`

  const linkClassMobile = ({ isActive }: { isActive: boolean }) =>
    `flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-[2px] transition-colors ${
      isActive ? 'bg-accent-ink text-white' : 'text-text-primary hover:bg-bg-hover'
    }`

  const links = (
    <>
      <NavLink to="/" end className={linkClass} onClick={() => setMobileOpen(false)}>
        <Home size={16} /> Dashboard
      </NavLink>
      <NavLink to="/summary" className={linkClass} onClick={() => setMobileOpen(false)}>
        <BarChart3 size={16} /> Summary
      </NavLink>
      <NavLink to="/settings" className={linkClass} onClick={() => setMobileOpen(false)}>
        <Settings size={16} /> Settings
      </NavLink>
    </>
  )

  const mobileLinks = (
    <>
      <NavLink to="/" end className={linkClassMobile} onClick={() => setMobileOpen(false)}>
        <Home size={18} /> Dashboard
      </NavLink>
      <NavLink to="/summary" className={linkClassMobile} onClick={() => setMobileOpen(false)}>
        <BarChart3 size={18} /> Summary
      </NavLink>
      <NavLink to="/settings" className={linkClassMobile} onClick={() => setMobileOpen(false)}>
        <Settings size={18} /> Settings
      </NavLink>
    </>
  )

  return (
    <nav className="border-b border-border-default bg-bg-base">
      <div className="flex items-center justify-between px-4 py-3 md:px-6">
        <NavLink to="/" className="text-xl font-heading text-text-primary no-underline">
          Expense Tracker
        </NavLink>

        <div className="flex items-center gap-2">
          <div className="hidden md:flex items-center gap-2">
            {links}
          </div>

          <div className="ml-1 pl-2 border-l border-border-default flex items-center gap-2">
            <div className="flex items-center gap-1.5 text-text-muted text-sm">
              <User size={16} />
              <span className="hidden sm:inline font-sans">User</span>
            </div>
            <button
              onClick={onLogout}
              className="flex items-center gap-1 p-1 border-none bg-transparent cursor-pointer text-text-muted hover:text-state-error text-xs"
              title="Sign out"
            >
              <LogOut size={14} />
            </button>
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden flex items-center p-1.5 border-none bg-transparent cursor-pointer text-text-muted hover:text-text-primary ml-1"
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>
      </div>

      {mobileOpen && (
        <div className="md:hidden border-t border-border-default px-4 py-3 space-y-1">
          {mobileLinks}
          <hr className="border-border-default my-2" />
          <button
            onClick={() => { onLogout(); setMobileOpen(false) }}
            className="flex items-center gap-2 px-4 py-2.5 text-sm font-medium rounded-[2px] text-state-error hover:bg-bg-hover w-full text-left border-none bg-transparent cursor-pointer"
          >
            <LogOut size={18} /> Sign out
          </button>
        </div>
      )}
    </nav>
  )
}