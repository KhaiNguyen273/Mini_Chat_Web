// src/hooks/useAuth.ts
import { useContext } from 'react'
import { AuthContext } from '../stores/authStore'

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth phải dùng trong AuthProvider')
  return ctx
}