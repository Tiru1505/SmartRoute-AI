import { Suspense, lazy } from 'react'
import { Route, Routes, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'
import Sidebar from './components/Sidebar'
import Navbar from './components/Navbar'
import LoadingScreen from './components/LoadingScreen'
import { useApp } from './store/AppContext'

const Dashboard = lazy(() => import('./pages/Dashboard'))
const RouteOptimizer = lazy(() => import('./pages/RouteOptimizer'))
const LiveTraffic = lazy(() => import('./pages/LiveTraffic'))
const Analytics = lazy(() => import('./pages/Analytics'))
const Benchmark = lazy(() => import('./pages/Benchmark'))
const Alerts = lazy(() => import('./pages/Alerts'))
const History = lazy(() => import('./pages/History'))
const Settings = lazy(() => import('./pages/Settings'))
const Login = lazy(() => import('./pages/Login'))

const pageMotion = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.26, ease: [0.22, 1, 0.36, 1] },
}

export default function App() {
  const location = useLocation()
  const { user } = useApp()

  // Unauthenticated users only ever see the sign-in screen.
  if (!user) {
    return (
      <Suspense fallback={<LoadingScreen label="Loading…" />}>
        <Login />
      </Suspense>
    )
  }

  return (
    <div className="app">
      <Sidebar />
      <div className="main">
        <Navbar />
        <Suspense fallback={<LoadingScreen />}>
          <AnimatePresence mode="wait">
            <motion.div key={location.pathname} className="page" {...pageMotion}>
              <Routes location={location}>
                <Route path="/" element={<Dashboard />} />
                <Route path="/optimizer" element={<RouteOptimizer />} />
                <Route path="/traffic" element={<LiveTraffic />} />
                <Route path="/analytics" element={<Analytics />} />
                <Route path="/benchmark" element={<Benchmark />} />
                <Route path="/alerts" element={<Alerts />} />
                <Route path="/history" element={<History />} />
                <Route path="/settings" element={<Settings />} />
                <Route path="*" element={<Dashboard />} />
              </Routes>
            </motion.div>
          </AnimatePresence>
        </Suspense>
      </div>
    </div>
  )
}
