// src/hooks/useMessageSearch.ts
import { useState } from 'react'
import { getMessagesApi } from '../api/message.api'
import type { Message } from '../types/message.types'

export function useMessageSearch(conversationId: string) {
  const [results, setResults] = useState<Message[]>([])
  const [searching, setSearching] = useState(false)
  const [hasSearched, setHasSearched] = useState(false)

  const search = async (q: string) => {
    if (!q.trim()) {
      setResults([])
      setHasSearched(false)
      return
    }
    setSearching(true)
    setHasSearched(true)
    try {
      const { messages } = await getMessagesApi(conversationId, undefined, 30, q)
      setResults(messages)
    } finally {
      setSearching(false)
    }
  }

  const clear = () => {
    setResults([])
    setHasSearched(false)
  }

  return { results, searching, hasSearched, search, clear }
}