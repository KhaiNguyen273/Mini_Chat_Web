import { useContext } from 'react'
import { ToastContext } from '../stores/toastStore'

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast phải dùng trong ToastProvider')
  return ctx
}