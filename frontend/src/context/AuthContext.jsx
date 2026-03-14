import { createContext, useContext, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('user')) } catch { return null }
  })
  const navigate = useNavigate()

  const login = useCallback(async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password })
    const payload = data.data || data
    const token = payload.accessToken || payload.token
    localStorage.setItem('token', token)
    if (payload.refreshToken) localStorage.setItem('refreshToken', payload.refreshToken)
    const userObj = payload.user || { email }
    localStorage.setItem('user', JSON.stringify(userObj))
    setUser(userObj)
    return userObj
  }, [])

  const register = useCallback(async (name, email, password) => {
    const { data } = await api.post('/auth/register', { name, email, password })
    // register returns just the user object (no token) — do a login after
    const loginData = await api.post('/auth/login', { email, password })
    const payload = loginData.data.data || loginData.data
    const token = payload.accessToken || payload.token
    localStorage.setItem('token', token)
    if (payload.refreshToken) localStorage.setItem('refreshToken', payload.refreshToken)
    const userObj = payload.user || data.data || data
    localStorage.setItem('user', JSON.stringify(userObj))
    setUser(userObj)
    return userObj
  }, [])

  const logout = useCallback(() => {
    localStorage.removeItem('token')
    localStorage.removeItem('refreshToken')
    localStorage.removeItem('user')
    setUser(null)
    navigate('/login')
  }, [navigate])

  const forgotPassword = useCallback(async (email) => {
    const res = await api.post('/auth/forgot-password', { email })
    // In dev mode, the backend returns the OTP directly
    return res.data
  }, [])

  const resetPassword = useCallback(async (email, otp, newPassword) => {
    await api.post('/auth/reset-password', { email, otp, newPassword })
  }, [])

  return (
    <AuthContext.Provider value={{ user, login, register, logout, forgotPassword, resetPassword }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
