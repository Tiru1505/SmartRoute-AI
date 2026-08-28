/**
 * Demo sign-in.
 *
 * There is no authentication backend. Nothing here validates a credential —
 * any well-formed input is accepted and the password is never stored or sent
 * anywhere. See the notice at the bottom of the form, which is deliberately
 * visible so nobody mistakes this for real auth.
 */
import { useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  ArrowRight, Atom, Bell, Eye, EyeOff, GitBranch, Loader2, Lock, Mail,
  ShieldAlert, User, Zap,
} from 'lucide-react'
import { useApp } from '../store/AppContext'
import { SYSTEM_STATUS } from '../data/mockData'

const FEATURES = [
  {
    icon: Atom,
    color: 'var(--quantum)',
    title: 'Quantum-inspired optimization',
    body: 'QPSO searches the road network for near-optimal routes across travel time, distance and congestion.',
  },
  {
    icon: GitBranch,
    color: 'var(--cyan)',
    title: 'Dynamic rerouting',
    body: 'When congestion spikes on your corridor, the engine re-runs and offers a better path.',
  },
  {
    icon: Bell,
    color: 'var(--moderate)',
    title: 'Predictive alerts',
    body: 'Warns before congestion builds — and only when an alternative actually saves meaningful time.',
  },
  {
    icon: Zap,
    color: 'var(--low)',
    title: 'Measured, not claimed',
    body: 'Benchmarked against Dijkstra, PSO and GA on identical problem instances.',
  },
]

export default function Login() {
  const { signIn, continueAsGuest } = useApp()

  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState(null)
  const [busy, setBusy] = useState(false)

  // Fixed positions so the particles don't jump on every keystroke.
  const particles = useMemo(
    () =>
      Array.from({ length: 26 }, (_, i) => ({
        left: (i * 37) % 100,
        top: (i * 53) % 100,
        delay: (i % 9) * 0.42,
        duration: 3.4 + (i % 5) * 0.65,
      })),
    []
  )

  const submit = async (e) => {
    e.preventDefault()
    setError(null)

    if (mode === 'signup' && !name.trim()) {
      setError('Please enter your name.')
      return
    }
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setError('Enter a valid email address.')
      return
    }
    if (password.length < 4) {
      setError('Password must be at least 4 characters.')
      return
    }

    setBusy(true)
    try {
      await signIn({ email, name: mode === 'signup' ? name.trim() : '' })
    } catch {
      setError('Sign-in failed. Please try again.')
    } finally {
      setBusy(false)
    }
  }

  return (
    <div className="login">
      {/* ------------------------------------------------- brand panel */}
      <div className="login-brand">
        <div className="login-particles" aria-hidden="true">
          {particles.map((p, i) => (
            <motion.span
              key={i}
              style={{ left: `${p.left}%`, top: `${p.top}%` }}
              animate={{ y: [0, -22, 0], opacity: [0.18, 0.62, 0.18] }}
              transition={{ duration: p.duration, repeat: Infinity, delay: p.delay, ease: 'easeInOut' }}
            />
          ))}
        </div>

        <motion.div
          className="login-brand-inner"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        >
          <div className="login-logo">
            <div className="logo-mark">QRO</div>
            <div>
              <strong>Quantum Route Optimizer</strong>
              <span>Intelligent Transportation Platform · Hyderabad</span>
            </div>
          </div>

          <h1>
            Routing that <em>rethinks itself</em> when the traffic changes.
          </h1>
          <p>
            An optimization and experimentation platform for intelligent transportation
            routing — built on Hyderabad's real road network.
          </p>

          <div className="login-features">
            {FEATURES.map((f, i) => (
              <motion.div
                key={f.title}
                className="login-feature"
                initial={{ opacity: 0, x: -14 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.42, delay: 0.15 + i * 0.09 }}
              >
                <span className="login-feature-icon" style={{ color: f.color }}>
                  <f.icon size={15} />
                </span>
                <div>
                  <h4>{f.title}</h4>
                  <p>{f.body}</p>
                </div>
              </motion.div>
            ))}
          </div>

          <div className="login-stats">
            <div className="login-stat">
              <b className="mono">286,603</b>
              <span>Graph nodes</span>
            </div>
            <div className="login-stat">
              <b className="mono">741,203</b>
              <span>Road segments</span>
            </div>
            <div className="login-stat">
              <b className="mono">52,309</b>
              <span>km mapped</span>
            </div>
          </div>
        </motion.div>
      </div>

      {/* -------------------------------------------------- form panel */}
      <div className="login-form-side">
        <motion.div
          className="login-card"
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.44, delay: 0.1, ease: [0.22, 1, 0.36, 1] }}
        >
          <h2>{mode === 'signin' ? 'Welcome back' : 'Create an account'}</h2>
          <p className="sub">
            {mode === 'signin'
              ? 'Sign in to plan and optimize routes.'
              : 'Set up a profile to save your routing preferences.'}
          </p>

          <div className="login-tabs" role="tablist">
            <button
              role="tab"
              aria-selected={mode === 'signin'}
              data-active={mode === 'signin'}
              onClick={() => { setMode('signin'); setError(null) }}
            >
              Sign in
            </button>
            <button
              role="tab"
              aria-selected={mode === 'signup'}
              data-active={mode === 'signup'}
              onClick={() => { setMode('signup'); setError(null) }}
            >
              Sign up
            </button>
          </div>

          {error && (
            <motion.div
              className="login-error"
              initial={{ opacity: 0, y: -6 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <ShieldAlert size={14} />
              {error}
            </motion.div>
          )}

          <form onSubmit={submit}>
            {mode === 'signup' && (
              <div className="field">
                <label htmlFor="name">Full name</label>
                <div className="login-input-wrap">
                  <User size={14} />
                  <input
                    id="name"
                    className="input"
                    type="text"
                    autoComplete="name"
                    placeholder="Your name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                  />
                </div>
              </div>
            )}

            <div className="field">
              <label htmlFor="email">Email</label>
              <div className="login-input-wrap">
                <Mail size={14} />
                <input
                  id="email"
                  className="input"
                  type="email"
                  autoComplete="email"
                  placeholder="you@example.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>

            <div className="field">
              <label htmlFor="password">Password</label>
              <div className="login-input-wrap">
                <Lock size={14} />
                <input
                  id="password"
                  className="input"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={mode === 'signin' ? 'current-password' : 'new-password'}
                  placeholder="At least 4 characters"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
                <button
                  type="button"
                  className="peek"
                  onClick={() => setShowPassword((v) => !v)}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff size={14} /> : <Eye size={14} />}
                </button>
              </div>
            </div>

            <button className="btn btn-primary btn-block" type="submit" disabled={busy}>
              {busy ? (
                <>
                  <motion.span
                    animate={{ rotate: 360 }}
                    transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}
                    style={{ display: 'grid', placeItems: 'center' }}
                  >
                    <Loader2 size={15} />
                  </motion.span>
                  Signing in…
                </>
              ) : (
                <>
                  {mode === 'signin' ? 'Sign in' : 'Create account'}
                  <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>

          <div className="login-divider">or</div>

          <button className="btn btn-block" onClick={continueAsGuest} disabled={busy}>
            Continue as guest
          </button>

          <div className="login-note">
            <ShieldAlert size={14} style={{ color: 'var(--moderate)', flexShrink: 0, marginTop: 1 }} />
            <p>
              <strong style={{ color: 'var(--moderate)' }}>Demo authentication.</strong>{' '}
              This prototype has no auth backend — no credential is checked, stored or
              transmitted. Use “Continue as guest” for the SIH demo.
            </p>
          </div>

          <p
            style={{
              textAlign: 'center', fontSize: 10.5, color: 'var(--text-faint)',
              marginTop: 18,
            }}
          >
            Quantum Route Optimizer {SYSTEM_STATUS.version} · Problem Statement 26137
          </p>
        </motion.div>
      </div>
    </div>
  )
}
