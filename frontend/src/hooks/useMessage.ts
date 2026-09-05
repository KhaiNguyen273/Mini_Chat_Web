
import { useState, useEffect, useCallback, useRef, useContext } from 'react'
import {
  getMessagesApi, getMessagesAfterApi, sendMessageApi, deleteMessageApi, editMessageApi
} from '../api/message.api'
import type { Message, MessageType } from '../types/message.types'
import { getSocket } from '../socket/socketClient'
import { ConversationContext } from '../contexts/ConversationContext'

export function useMessage(conversationId: string | undefined) {
  const [messages, setMessages] = useState<Message[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [error, setError] = useState('')
  const cursorRef = useRef<string | null>(null)
  const loadingMoreRef = useRef(false)
  // dùng useContext trực tiếp (không phải useConversationContext) để không throw
  // nếu lỡ useMessage được gọi ngoài MainLayout
  const conversationCtx = useContext(ConversationContext)

  
  const fetchInitial = useCallback(async () => {
    if (!conversationId) return
    setLoading(true)
    setError('')
    cursorRef.current = null
    loadingMoreRef.current = false // reset khi đổi conversation
    try {
      const { messages: data, nextCursor } = await getMessagesApi(conversationId)
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
    // khoá bằng REF — cập nhật đồng bộ ngay lập tức, không chờ React
    // re-render như state loadingMore, nên chặn được lệnh gọi thứ 2 bắn ra
    // trong cùng 1 nhịp sự kiện scroll dồn dập (trackpad/inertia)
    if (!conversationId || !hasMore || loadingMoreRef.current || !cursorRef.current) return
    loadingMoreRef.current = true
    setLoadingMore(true)
    try {
      const { messages: data, nextCursor } = await getMessagesApi(conversationId, cursorRef.current)
      const reversed = [...data].reverse()
      setMessages((prev) => [...reversed, ...prev])
      cursorRef.current = nextCursor
      setHasMore(nextCursor !== null)
    } catch {
      setError('Không tải thêm được tin nhắn cũ hơn')
    } finally {
      setLoadingMore(false)
      loadingMoreRef.current = false
    }
  }

  const sendMessage = async (content: string, type: MessageType = 'text', files: File[] = []) => {
  if (!conversationId) return

  if (files.length > 0) {
    const newMsg = await sendMessageApi(conversationId, content, type, files)
    const applied = conversationCtx?.touchConversation(conversationId, {
      content: newMsg.content,
      type: newMsg.type,
      sender_id: String(newMsg.sender_id),
      created_at: newMsg.created_at,
    })
    if (applied === false) conversationCtx?.refetch()
    return newMsg
  }

  return new Promise<Message>((resolve, reject) => {
    const socket = getSocket()
    if (!socket) {
      reject(new Error('Mất kết nối realtime, vui lòng thử lại'))
      return
    }
    socket.emit(
      'message:send',
      { conversationId: Number(conversationId), content, type },
      (ack: { ok: boolean; data?: any; message?: string }) => {
        if (ack.ok) {
          const normalized: Message = { ...ack.data, id: String(ack.data.id), sender_id: String(ack.data.sender_id) }
          const applied = conversationCtx?.touchConversation(conversationId, {
            content: normalized.content,
            type: normalized.type,
            sender_id: normalized.sender_id,
            created_at: normalized.created_at,
          })
          if (applied === false) conversationCtx?.refetch()
          resolve(normalized)
        } else {
          reject(new Error(ack.message || 'Gửi tin nhắn thất bại'))
        }
      }
    )
  })
}

  const deleteMessage = async (messageId: string) => {
    await deleteMessageApi(messageId)
    // KHÔNG tự filter/set state ở đây — chờ "message:deleted" từ socket vòng
    // về (kể cả cho chính người thu hồi), đảm bảo mọi nơi cùng 1 nguồn sự
    // thật duy nhất, đúng pattern đã áp dụng cho pin/unpin ở mục 4
  }

  const editMessage = async (messageId: string, content: string) => {
    const updated = await editMessageApi(messageId, content)
    setMessages((prev) => prev.map((m) => (m.id === messageId ? updated : m)))
    return updated
  }

  useEffect(() => {
    fetchInitial()
  }, [fetchInitial])

  useEffect(() => {
    const socket = getSocket()
    if (!socket || !conversationId) return

    socket.emit('conversation:join', Number(conversationId))

    const handleNewMessage = (msg: any) => {
      if (String(msg.conversation_id) !== conversationId) return
      const normalized: Message = { ...msg, id: String(msg.id), sender_id: String(msg.sender_id) }
      setMessages((prev) => (prev.some((m) => m.id === normalized.id) ? prev : [...prev, normalized]))
    }

    socket.on('message:new', handleNewMessage)
    return () => {
      socket.off('message:new', handleNewMessage)
      // socket.emit('conversation:leave', Number(conversationId))
    }
  }, [conversationId])

  // thêm vào cạnh effect lắng nghe "message:new" trong useMessage.ts
  useEffect(() => {
    const socket = getSocket()
    if (!socket || !conversationId) return

    const handleDeleted = ({ conversationId: cid, messageId }: { conversationId: number; messageId: number }) => {
      if (String(cid) !== conversationId) return
      setMessages((prev) =>
        prev.map((m) =>
          String(m.id) === String(messageId)
            ? { ...m, content: '', type: 'text', attachments: [], is_deleted: true } as any
            : m
        )
      )
    }

    socket.on('message:deleted', handleDeleted)
    return () => { socket.off('message:deleted', handleDeleted) }
  }, [conversationId])

  const messagesRef = useRef(messages)
  useEffect(() => { messagesRef.current = messages }, [messages])

  const jumpToMessage = async (messageId: string, messageCreatedAt: string) => {
    if (messagesRef.current.some((m) => m.id === messageId)) return true
    setLoading(true)
    try {
      const beforeCursorDate = new Date(messageCreatedAt)
      beforeCursorDate.setSeconds(beforeCursorDate.getSeconds() + 1)
      const beforeCursor = beforeCursorDate.toISOString()
      const afterCursor = messageCreatedAt

      const [beforeResult, afterMessages] = await Promise.all([
        getMessagesApi(conversationId!, beforeCursor, 20),
        getMessagesAfterApi(conversationId!, afterCursor, 15),
      ])

      const beforeAsc = [...beforeResult.messages].reverse()
      const combined = [...beforeAsc, ...afterMessages]
      const uniqueMap = new Map(combined.map((m) => [m.id, m]))
      const sorted = Array.from(uniqueMap.values()).sort((a, b) => {
        const timeDiff = new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
        if (timeDiff !== 0) return timeDiff
        return Number(a.id) - Number(b.id)
      })

      setMessages(sorted)
      cursorRef.current = beforeResult.nextCursor
      setHasMore(beforeResult.nextCursor !== null)
      return true
    } catch {
      return false
    } finally {
      setLoading(false)
    }
  }

  return {
    messages, loading, loadingMore, hasMore, error,
    loadMore, sendMessage, deleteMessage, editMessage, jumpToMessage,
    refetch: fetchInitial,
  }
}