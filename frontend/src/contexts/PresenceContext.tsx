// src/contexts/PresenceContext.tsx
import { createContext, useContext, type ReactNode } from 'react'
import { usePresenceState } from '../hooks/usePresence'

export const PresenceContext = createContext<ReturnType<typeof usePresenceState> | null>(null)

export function PresenceProvider({ children }: { children: ReactNode }) {
  const presenceState = usePresenceState()
  return (
    <PresenceContext.Provider value={presenceState}>
      {children}
    </PresenceContext.Provider>
  )
}

export function usePresenceContext() {
  const ctx = useContext(PresenceContext)
  if (!ctx) throw new Error('usePresenceContext phải dùng trong PresenceProvider')
  return ctx
}