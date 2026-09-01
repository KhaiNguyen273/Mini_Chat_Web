

import { useState, useEffect, useCallback } from 'react'
import { getPendingConversationsApi, acceptPendingApi, rejectPendingApi } from '../api/conversation.api'
import type { Conversation } from '../types/conversation.types'
import { getSocket } from '../socket/socketClient'

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

  // người lạ nhắn tin làm quen lần đầu — BE emit conversation:new với status "pending"
  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    const handleNewConversation = (conv: any) => {
      if (conv.status !== 'pending') return
      setPendingList((prev) => {
        const exists = prev.some((c) => String(c.id) === String(conv.id))
        if (exists) return prev
        return [{ ...conv, id: String(conv.id) }, ...prev]
      })
    }

    socket.on('conversation:new', handleNewConversation)
    return () => { socket.off('conversation:new', handleNewConversation) }
  }, [])

  // MỚI — đồng bộ đa tab/thiết bị: nếu accept/reject được bấm ở tab/thiết bị
  // khác của chính B, tab này cũng tự xoá item khỏi Pending, không cần F5
  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    const handleStatus = ({ conversationId }: { conversationId: number; status: string }) => {
      setPendingList((prev) => prev.filter((c) => String(c.id) !== String(conversationId)))
    }

    socket.on('conversation:status', handleStatus)
    return () => { socket.off('conversation:status', handleStatus) }
  }, [])

  return { pendingList, loading, accept, reject, refetch: fetchPending }
}