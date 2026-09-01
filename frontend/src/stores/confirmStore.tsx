// src/stores/confirmStore.tsx
import { createContext, useState, useCallback, type ReactNode } from 'react'
import type { ConfirmOptions } from '../types/confirm.types'

interface ConfirmState extends ConfirmOptions {
  open: boolean
}

interface ConfirmContextValue {
  state: ConfirmState
  confirm: (options: ConfirmOptions) => Promise<boolean>
  handleConfirm: () => void
  handleCancel: () => void
}

export const ConfirmContext = createContext<ConfirmContextValue | null>(null)

const initialState: ConfirmState = { open: false, title: '', message: '' }

export function ConfirmProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<ConfirmState>(initialState)
  const [resolver, setResolver] = useState<((value: boolean) => void) | null>(null)

  // trả về Promise<boolean> — component gọi `const ok = await confirm(...)`
  const confirm = useCallback((options: ConfirmOptions) => {
    return new Promise<boolean>((resolve) => {
      setState({ ...options, open: true })
      setResolver(() => resolve)
    })
  }, [])

  const handleConfirm = useCallback(() => {
    resolver?.(true)
    setState(initialState)
    setResolver(null)
  }, [resolver])

  const handleCancel = useCallback(() => {
    resolver?.(false)
    setState(initialState)
    setResolver(null)
  }, [resolver])

  return (
    <ConfirmContext.Provider value={{ state, confirm, handleConfirm, handleCancel }}>
      {children}
    </ConfirmContext.Provider>
  )
}