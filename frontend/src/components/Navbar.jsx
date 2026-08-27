import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Bell, LogOut, Moon, Settings as SettingsIcon, Sun, TriangleAlert } from 'lucide-react'
import { useApp } from '../store/AppContext'
import { NAV_ITEMS } from './Sidebar'
import { TRAFFIC_COLORS } from '../data/mockData'

/** Average congestion across all segments → a single city-wide status word. */
function cityStatus(segments) {
  if (!segments.length) return { label: 'Unknown', level: 'low' }
  const avg = segments.reduce((s, x) => s + x.congestion, 0) / segments.length
  if (avg < 0.3) return { label: 'Light traffic', level: 'low' }
  if (avg < 0.5) return { label: 'Moderate traffic', level: 'moderate' }
  if (avg < 0.7) return { label: 'Heavy traffic', level: 'heavy' }
  return { label: 'Severe congestion', level: 'severe' }
}

export default function Navbar() {
  const { alerts, dismissAlert, theme, setTheme, segments, user, signOut } = useApp()
  const [open, setOpen] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const ref = useRef(null)
  const location = useLocation()
  const navigate = useNavigate()

  const current = NAV_ITEMS.find((n) =>
    n.end ? location.pathname === n.to : location.pathname.startsWith(n.to)
  )
  const status = cityStatus(segments)

  useEffect(() => {
    const onClick = (e) => {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false)
        setMenuOpen(false)
      }
    }
    document.addEventListener('mousedown', onClick)
    return () => document.removeEventListener('mousedown', onClick)
  }, [])

  return (
    <header className="navbar">
      <div>
        <h2>{current?.label || 'Quantum Route Optimizer'}</h2>
      </div>

      <div className="navbar-right" ref={ref}>
        <div className="live-chip">
          <span className="dot pulse" style={{ background: 'currentColor' }} />
          LIVE
        </div>

        <div
          className="badge badge-grey"
          style={{ color: TRAFFIC_COLORS[status.level], borderColor: 'var(--border)' }}
        >
          <span className="dot" style={{ background: TRAFFIC_COLORS[status.level] }} />
          {status.label}
        </div>

        <button
          className="icon-btn"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          aria-label="Toggle theme"
        >
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </button>

        <button
          className="icon-btn"
          onClick={() => { setOpen((v) => !v); setMenuOpen(false) }}
          aria-label="Notifications"
        >
          <Bell size={16} />
          {alerts.length > 0 && <span className="badge-dot" />}
        </button>

        <button
          className="avatar"
          onClick={() => { setMenuOpen((v) => !v); setOpen(false) }}
          aria-label="Account menu"
          aria-expanded={menuOpen}
        >
          {user?.initials || 'QR'}
        </button>

        <AnimatePresence>
          {menuOpen && (
            <motion.div
              className="user-menu"
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.16 }}
            >
              <div className="user-menu-head">
                <div className="avatar" style={{ cursor: 'default' }}>
                  {user?.initials}
                </div>
                <div style={{ minWidth: 0 }}>
                  <strong>{user?.name}</strong>
                  <span
                    style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                  >
                    {user?.email}
                  </span>
                </div>
              </div>

              {user?.guest && (
                <div
                  className="badge badge-yellow"
                  style={{ margin: '0 9px 7px', display: 'flex', justifyContent: 'center' }}
                >
                  Guest session
                </div>
              )}

              <button
                className="item"
                onClick={() => { setMenuOpen(false); navigate('/settings') }}
              >
                <SettingsIcon size={14} /> Settings
              </button>
              <button className="item danger" onClick={signOut}>
                <LogOut size={14} /> Sign out
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {open && (
            <motion.div
              className="notif-panel"
              initial={{ opacity: 0, y: -8, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -8, scale: 0.98 }}
              transition={{ duration: 0.18 }}
            >
              <div className="card-title" style={{ padding: '4px 8px', marginBottom: 4 }}>
                Notifications ({alerts.length})
              </div>
              {alerts.length === 0 ? (
                <div className="empty" style={{ padding: 24 }}>
                  <Bell size={22} />
                  <span style={{ fontSize: 12 }}>You're all caught up</span>
                </div>
              ) : (
                alerts.map((a) => (
                  <motion.div
                    key={a.id}
                    className="notif-item"
                    layout
                    exit={{ opacity: 0, x: 30 }}
                    onClick={() => dismissAlert(a.id)}
                  >
                    <TriangleAlert size={15} style={{ color: TRAFFIC_COLORS[a.severity], flexShrink: 0, marginTop: 2 }} />
                    <div style={{ minWidth: 0 }}>
                      <h5>{a.title}</h5>
                      <p>{a.location}</p>
                      <time>{a.time}</time>
                    </div>
                  </motion.div>
                ))
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </header>
  )
}
