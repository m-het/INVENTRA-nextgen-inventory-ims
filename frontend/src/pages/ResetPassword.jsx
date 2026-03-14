import { useState, useRef } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { Package, ArrowLeft, Mail, CheckCircle } from 'lucide-react'
import { FadeIn } from '../components/Animated'
import { useAuth } from '../context/AuthContext'
import '../styles/auth.css'

export default function ResetPassword() {
  const [step, setStep] = useState(1) // 1=email, 2=otp, 3=new-pw, 4=done
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [email, setEmail] = useState('')
  const [devOtp, setDevOtp] = useState('')   // shown in dev when backend returns it
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const refs = useRef([])
  const navigate = useNavigate()
  const { forgotPassword, resetPassword } = useAuth()

  const handleOtp = (val, idx) => {
    const next = [...otp]; next[idx] = val.slice(-1)
    setOtp(next)
    if (val && idx < 5) refs.current[idx + 1]?.focus()
  }

  const handleStep1 = async () => {
    setError('')
    setLoading(true)
    try {
      const result = await forgotPassword(email)
      if (result?.otpForDev) setDevOtp(result.otpForDev)  // dev mode: show OTP
      setStep(2)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to send OTP. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const handleStep2 = () => {
    // OTP verification is handled in step 3 (token from OTP code)
    setStep(3)
  }

  const handleStep3 = async () => {
    if (password !== confirmPassword) { setError('Passwords do not match'); return }
    setError('')
    setLoading(true)
    try {
      const otpCode = otp.join('')
      await resetPassword(email, otpCode, password)
      setStep(4)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to reset password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      <div className="auth-bg">
        {[...Array(4)].map((_, i) => (
          <motion.div key={i} className="auth-orb"
            style={{ left: `${15 + i * 22}%`, top: `${25 + (i % 2) * 40}%` }}
            animate={{ y: [0, -25, 0], opacity: [0.07, 0.15, 0.07] }}
            transition={{ duration: 4 + i, repeat: Infinity, delay: i * 0.8 }}
          />
        ))}
      </div>

      <FadeIn className="auth-card-wrap">
        <div className="auth-logo">
          <div className="auth-logo-icon"><Package size={24} /></div>
          <div className="auth-left">
            <div className="auth-brand">INVENTRA</div>
            <div className="auth-tagline">Inventory Management System</div>
            <p className="auth-description">
              Reclaim access to your account and get back to managing your operations securely and efficiently.
            </p>
          </div>
        </div>

        <div className="auth-card">
          <div style={{ padding: '28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {step === 4 ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ textAlign: 'center', padding: '20px 0' }}
              >
                <CheckCircle size={52} color="var(--status-done)" style={{ margin: '0 auto 16px' }} />
                <div style={{ fontSize: 18, fontWeight: 700, marginBottom: 8 }}>Password Updated!</div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginBottom: 24 }}>You can now sign in with your new password.</div>
                <button className="auth-submit" onClick={() => navigate('/login')}>Go to Sign In</button>
              </motion.div>
            ) : (
              <>
                <div style={{ fontSize: 17, fontWeight: 700 }}>
                  {step === 1 && 'Enter your email'}
                  {step === 2 && 'Enter OTP'}
                  {step === 3 && 'New Password'}
                </div>
                <div style={{ fontSize: 13, color: 'var(--text-muted)', marginTop: -12 }}>
                  {step === 1 && "We'll send a 6-digit OTP to your email."}
                  {step === 2 && 'Check your inbox and enter the code below.'}
                  {step === 3 && 'Choose a strong new password.'}
                </div>

                {step === 1 && (
                  <div className="form-group">
                    <label className="form-label">Email Address</label>
                    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                      <Mail size={15} style={{ position: 'absolute', left: 10, color: 'var(--text-muted)' }} />
                      <input className="form-input" style={{ paddingLeft: 34 }} type="email" placeholder="you@company.com"
                        value={email} onChange={e => setEmail(e.target.value)} />
                    </div>
                  </div>
                )}

                {step === 2 && (
                  <>
                    <div className="otp-wrap">
                      {otp.map((v, i) => (
                        <input
                          key={i}
                          ref={el => refs.current[i] = el}
                          className="otp-input"
                          maxLength={1}
                          value={v}
                          onChange={e => handleOtp(e.target.value, i)}
                          onKeyDown={e => { if (e.key === 'Backspace' && !v && i > 0) refs.current[i - 1]?.focus() }}
                        />
                      ))}
                    </div>
                    {devOtp && (
                      <div style={{ fontSize: 12, color: 'var(--status-waiting)', background: 'var(--bg-secondary)', borderRadius: 8, padding: '8px 12px' }}>
                        🛠️ Dev mode — OTP: <strong>{devOtp}</strong>
                      </div>
                    )}
                  </>
                )}

                {step === 3 && (
                  <>
                    <div className="form-group">
                      <label className="form-label">New Password</label>
                      <input className="form-input" type="password" placeholder="••••••••" value={password} onChange={e => setPassword(e.target.value)} />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Confirm Password</label>
                      <input className="form-input" type="password" placeholder="••••••••" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} />
                    </div>
                  </>
                )}

                {error && (
                  <div style={{ color: 'var(--status-cancelled)', fontSize: 13 }}>{error}</div>
                )}

                <button className="auth-submit" disabled={loading}
                  onClick={step === 1 ? handleStep1 : step === 2 ? handleStep2 : handleStep3}>
                  {loading ? 'Please wait…' : step === 1 ? 'Send OTP' : step === 2 ? 'Verify Code' : 'Update Password'}
                </button>

                <Link to="/login" style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: 'var(--text-muted)', textDecoration: 'none', justifyContent: 'center' }}>
                  <ArrowLeft size={14} /> Back to Sign In
                </Link>
              </>
            )}
          </div>
        </div>
      </FadeIn>
    </div>
  )
}
