import { useState } from 'react'
import { useNavigate, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { Package, Eye, EyeOff, ArrowRight, Shield } from 'lucide-react'
import { GlowPulse, FadeIn } from '../components/Animated'
import { useAuth } from '../context/AuthContext'
import '../styles/auth.css'

export default function Login() {
  const [tab, setTab] = useState('login')
  const [show, setShow] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const navigate = useNavigate()
  const { login, register } = useAuth()

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      if (tab === 'login') {
        await login(form.email, form.password)
      } else {
        await register(form.name, form.email, form.password)
      }
      navigate('/dashboard')
    } catch (err) {
      if (!err.response) {
        setError('Cannot connect to server. Make sure the backend is running.')
      } else {
        setError(err.response?.data?.message || 'Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      {/* Background particles */}
      <div className="auth-bg">
        {[...Array(6)].map((_, i) => (
          <motion.div
            key={i}
            className="auth-orb"
            style={{ left: `${10 + i * 18}%`, top: `${20 + (i % 3) * 30}%` }}
            animate={{ y: [0, -30, 0], opacity: [0.08, 0.18, 0.08] }}
            transition={{ duration: 4 + i, repeat: Infinity, delay: i * 0.7 }}
          />
        ))}
      </div>

      <FadeIn className="auth-card-wrap">
        {/* Logo */}
        <div className="auth-logo">
          <GlowPulse>
            <div className="auth-logo-icon"><Package size={24} /></div>
          </GlowPulse>
          <div className="auth-left">
            <div className="auth-brand">INVENTRA</div>
            <div className="auth-tagline">Inventory Management System</div>
            <p className="auth-description">
              A modern, intelligent platform for seamless inventory and warehouse management.
            </p>
          </div>
        </div>

        {/* Card */}
        <div className="auth-card">
          {/* Tabs */}
          <div className="auth-tabs">
            {['login', 'signup'].map(t => (
              <button
                key={t}
                className={`auth-tab${tab === t ? ' active' : ''}`}
                onClick={() => { setTab(t); setError('') }}
              >
                {t === 'login' ? 'Sign In' : 'Sign Up'}
              </button>
            ))}
            <motion.div
              className="auth-tab-indicator"
              animate={{ x: tab === 'login' ? 0 : '100%' }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            />
          </div>

          {/* Form */}
          <AnimatePresence mode="wait">
            <motion.form
              key={tab}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.25 }}
              onSubmit={handleSubmit}
              className="auth-form"
            >
              {tab === 'signup' && (
                <div className="form-group">
                  <label className="form-label">Full Name</label>
                  <input className="form-input" placeholder="John Doe" required value={form.name} onChange={e => set('name', e.target.value)} />
                </div>
              )}
              <div className="form-group">
                <label className="form-label">Email Address</label>
                <input className="form-input" type="email" placeholder="you@company.com" required value={form.email} onChange={e => set('email', e.target.value)} />
              </div>
              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="pw-wrap">
                  <input
                    className="form-input"
                    type={show ? 'text' : 'password'}
                    placeholder="••••••••"
                    required
                    value={form.password}
                    onChange={e => set('password', e.target.value)}
                  />
                  <button type="button" className="pw-toggle" onClick={() => setShow(s => !s)}>
                    {show ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
              </div>

              {tab === 'login' && (
                <div className="auth-forgot">
                  <Link to="/reset-password">Forgot password?</Link>
                </div>
              )}

              {error && (
                <div style={{ color: 'var(--status-cancelled)', fontSize: 13, textAlign: 'center', marginTop: -4 }}>
                  {error}
                </div>
              )}

              <button type="submit" className="auth-submit" disabled={loading}>
                <span>{loading ? 'Please wait…' : tab === 'login' ? 'Sign In' : 'Create Account'}</span>
                {!loading && <ArrowRight size={16} />}
              </button>

              <div className="auth-security">
                <Shield size={13} />
                <span>Secured with 256-bit AES encryption</span>
              </div>
            </motion.form>
          </AnimatePresence>
        </div>
      </FadeIn>
    </div>
  )
}
