// src/components/ui/ToastContainer.tsx
import type { ReactElement } from 'react'
import { useToast } from '../../hooks/useToast'
import type { ToastType } from '../../types/toast.types'

const styleByType: Record<ToastType, string> = {
  success: 'bg-[#38bdf8] text-white',
  error: 'bg-[#dc2626] text-white',
  info: 'bg-[#1e293b] text-white',
}

const iconByType: Record<ToastType, ReactElement> = {
  success: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <path d="M20 6 9 17l-5-5"/>
    </svg>
  ),
  error: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="12" cy="12" r="10"/><path d="m15 9-6 6M9 9l6 6"/>
    </svg>
  ),
  info: (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
      <circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/>
    </svg>
  ),
}

function ToastContainer() {
  const { toasts, removeToast } = useToast()

  if (toasts.length === 0) return null

  return (
    <div className="fixed top-4 right-4 z-[100] flex flex-col gap-2">
      {toasts.map((t) => (
        <div
          key={t.id}
          onClick={() => removeToast(t.id)}
          className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-medium cursor-pointer ${styleByType[t.type]}`}
        >
          {iconByType[t.type]}
          {t.message}
        </div>
      ))}
    </div>
  )
}

export default ToastContainer