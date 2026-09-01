// src/hooks/useConfirm.ts
import { useContext } from 'react'
import { ConfirmContext } from '../stores/confirmStore'

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error('useConfirm phải dùng trong ConfirmProvider')
  return ctx.confirm
}