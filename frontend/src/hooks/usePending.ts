import { useState, useEffect, useCallback } from 'react'
import { getPendingConversationsApi, acceptPendingApi, rejectPendingApi } from '../api/conversation.api'
import type { Conversation } from '../types/conversation.types'

export function usePending() {
  const [pendingList, setPendingList] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(false)

  const fetchPending = useCallback(async () => {
    setLoading(true)
    try {
      setPendingList(await getPendingConversationsApi())
    } finally {
      setLoading(false)
    }
  }, [])

  // trả về conversation id đã accept để component gọi điều hướng sang /chat
  const accept = async (id: string) => {
    await acceptPendingApi(id)
    setPendingList((prev) => prev.filter((c) => c.id !== id))
  }

  const reject = async (id: string) => {
    await rejectPendingApi(id)
    setPendingList((prev) => prev.filter((c) => c.id !== id))
  }

  useEffect(() => {
    fetchPending()
  }, [fetchPending])

  return { pendingList, loading, accept, reject, refetch: fetchPending }
}