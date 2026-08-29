import { NavLink, useLocation } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Activity, BarChart3, Bell, ChevronLeft, ChevronRight, FlaskConical,
  History as HistoryIcon, LayoutDashboard, Route as RouteIcon, Settings as SettingsIcon,
} from 'lucide-react'
import { useApp } from '../store/AppContext'
import { SYSTEM_STATUS } from '../data/mockData'

export const NAV_ITEMS = [
  { to: '/', label: 'Dashboard', icon: LayoutDashboard, end: true },
  { to: '/optimizer', label: 'Route Optimizer', icon: RouteIcon },
  { to: '/traffic', label: 'Live Traffic', icon: Activity },
  { to: '/analytics', label: 'Analytics', icon: BarChart3 },
  { to: '/benchmark', label: 'Benchmark', icon: FlaskConical },
  { to: '/alerts', label: 'Alerts', icon: Bell, showCount: true },
  { to: '/history', label: 'History', icon: HistoryIcon },
  { to: '/settings', label: 'Settings', icon: SettingsIcon },
]

export default function Sidebar() {
  const { collapsed, setCollapsed, alerts, theme } = useApp()
  const location = useLocation()

  return (
    <>
      <aside className="sidebar" data-collapsed={collapsed}>
        <div className="sidebar-head">
          <div className="logo-mark">QRO</div>
          <AnimatePresence initial={false}>
            {!collapsed && (
              <motion.div
                className="logo-text"
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: 'auto' }}
                exit={{ opacity: 0, width: 0 }}
                transition={{ duration: 0.2 }}
              >
                <strong>Quantum Route</strong>
                <span>Optimizer</span>
              </motion.div>
            )}
          </AnimatePresence>

          <button
            className="collapse-btn"
            onClick={() => setCollapsed(!collapsed)}
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {collapsed ? <ChevronRight size={13} /> : <ChevronLeft size={13} />}
          </button>
        </div>

        <nav className="sidebar-nav">
          {NAV_ITEMS.map(({ to, label, icon: Icon, end, showCount }) => (
            <NavLink
              key={to}
              to={to}
              end={end}
              className={({ isActive }) => `nav-item${isActive ? ' active' : ''}`}
              title={collapsed ? label : undefined}
            >
              <Icon size={17} />
              {!collapsed && (
                <>
                  <span>{label}</span>
                  {showCount && alerts.length > 0 && (
                    <span className="nav-count">{alerts.length}</span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </nav>

        {!collapsed && (
          <div className="sidebar-foot">
            <div className="row-between">
              <span>Theme</span>
              <span style={{ color: 'var(--text-dim)', textTransform: 'capitalize' }}>{theme}</span>
            </div>
            <div className="row-between">
              <span>Backend</span>
              <span
                className={`badge ${SYSTEM_STATUS.backend === 'live'
                  ? 'badge-green' : 'badge-yellow'}`}
                style={{ padding: '1px 7px' }}
              >
                {SYSTEM_STATUS.backend}
              </span>
            </div>
            <div className="row-between">
              <span>Version</span>
              <span className="mono" style={{ color: 'var(--text-dim)' }}>
                {SYSTEM_STATUS.version}
              </span>
            </div>
          </div>
        )}
      </aside>

      {/* Bottom navigation replaces the sidebar below 900px */}
      <nav className="mobile-nav">
        {NAV_ITEMS.slice(0, 5).map(({ to, label, icon: Icon, end }) => {
          const active = end ? location.pathname === to : location.pathname.startsWith(to)
          return (
            <NavLink key={to} to={to} end={end} className={active ? 'active' : ''}>
              <Icon size={18} />
              <span>{label.split(' ')[0]}</span>
            </NavLink>
          )
        })}
      </nav>
    </>
  )
}
