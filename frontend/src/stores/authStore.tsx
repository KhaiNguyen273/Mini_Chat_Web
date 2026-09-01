// src/stores/authStore.tsx
import { createContext, useState, useEffect, type ReactNode } from 'react'
import axios from 'axios'
import type { User, LoginPayload, RegisterPayload } from '../types/auth.types'
import { loginApi, logoutApi, registerApi, getMeApi } from '../api/auth.api'
import { setAccessToken, clearAccessToken } from '../utils/tokenStorage'
import { connectSocket, disconnectSocket } from '../socket/socketClient'

interface AuthContextValue {
  user: User | null
  loading: boolean
  login: (payload: LoginPayload) => Promise<void>
  register: (payload: RegisterPayload) => Promise<void>
  logout: () => Promise<void>
  setUser: (user: User | null) => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  // F5 lại trang: accessToken trong memory đã mất, nhưng cookie refreshToken
  // (httpOnly) vẫn còn trên browser → thử silent refresh để lấy lại accessToken
  useEffect(() => {
    axios
      .post(`${BASE_URL}/auth/refresh`, {}, { withCredentials: true })
      .then(async (res) => {
        setAccessToken(res.data.data.accessToken)
        connectSocket()
        const me = await getMeApi()
        setUser(me)
      })
      .catch(() => {
        // không có cookie hợp lệ → coi như chưa đăng nhập, không cần báo lỗi
      })
      .finally(() => setLoading(false))
  }, [])

  const login = async (payload: LoginPayload) => {
    const data = await loginApi(payload)
    setAccessToken(data.accessToken)
    connectSocket()
    const fullUser = await getMeApi()
    setUser(fullUser)
  }

  const register = async (payload: RegisterPayload) => {
    await registerApi(payload)
  }

  const logout = async () => {
    try { await logoutApi() } catch { /* ignore */ }
    clearAccessToken()
    disconnectSocket()
    setUser(null)
  }

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout, setUser }}>
    {children}
  </AuthContext.Provider>
  )
}