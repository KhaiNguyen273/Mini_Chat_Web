// src/hooks/useMessage.ts
import { useState, useEffect, useCallback, useRef } from 'react'
import {
  getMessagesApi,
  sendMessageApi,
  deleteMessageApi,
  editMessageApi,
} from '../api/message.api'
import type { Message, MessageType } from '../types/message.types'

export function useMessage(conversationId: string | undefined) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState('')
  const cursorRef = useRef<string | null>(null)

  const fetchInitial = useCallback(async () => {
    if (!conversationId) return
    setLoading(true)
    setError('')
    cursorRef.current = null
    try {
      const { messages: data, nextCursor } = await getMessagesApi(conversationId)
      // API trả tin mới nhất trước (theo cursor created_at), đảo lại để hiện cũ → mới trong UI
      setMessages([...data].reverse())
      cursorRef.current = nextCursor
      setHasMore(nextCursor !== null)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không tải được tin nhắn')
    } finally {
      setLoading(false)
    }
  }, [conversationId])

  const loadMore = async () => {
    if (!conversationId || !hasMore || loadingMore || !cursorRef.current) return
    setLoadingMore(true)
    try {
      const { messages: data, nextCursor } = await getMessagesApi(conversationId, cursorRef.current)
      setMessages((prev) => [...data.reverse(), ...prev]) // nối tin cũ hơn vào đầu danh sách
      cursorRef.current = nextCursor
      setHasMore(nextCursor !== null)
    } catch {
      setError('Không tải thêm được tin nhắn cũ hơn')
    } finally {
      setLoadingMore(false)
    }
  }

  const sendMessage = async (content: string, type: MessageType = 'text', files: File[] = []) => {
    if (!conversationId) return
    const newMsg = await sendMessageApi(conversationId, content, type, files)
    setMessages((prev) => [...prev, newMsg])
    return newMsg
  }

  const deleteMessage = async (messageId: string) => {
    await deleteMessageApi(messageId)
    setMessages((prev) => prev.filter((m) => m.id !== messageId))
  }

  const editMessage = async (messageId: string, content: string) => {
    const updated = await editMessageApi(messageId, content)
    setMessages((prev) => prev.map((m) => (m.id === messageId ? updated : m)))
    return updated
  }

  useEffect(() => {
    fetchInitial()
  }, [fetchInitial])

  return {
    messages,
    loading,
    loadingMore,
    hasMore,
    error,
    loadMore,
    sendMessage,
    deleteMessage,
    editMessage,
  }
}