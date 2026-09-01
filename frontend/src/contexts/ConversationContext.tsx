// src/contexts/ConversationContext.tsx
import { createContext, useContext } from 'react'
import type { useConversation } from '../hooks/useConversation'

export const ConversationContext = createContext<ReturnType<typeof useConversation> | null>(null)

export function useConversationContext() {
  const ctx = useContext(ConversationContext)
  if (!ctx) throw new Error('useConversationContext phải dùng trong MainLayout')
  return ctx
}