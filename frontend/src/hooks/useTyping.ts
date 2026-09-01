// src/hooks/useTyping.ts
import { useState, useEffect, useRef, useCallback } from 'react'
import { getSocket } from '../socket/socketClient'

export function useTyping(conversationId: string | undefined) {
  const [typingUserId, setTypingUserId] = useState<string | null>(null)
  const stopTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    const socket = getSocket()
    if (!socket || !conversationId) return

    const handleStart = ({ conversationId: cid, userId }: { conversationId: number; userId: number }) => {
      if (String(cid) !== conversationId) return
      setTypingUserId(String(userId))
    }
    const handleStop = ({ conversationId: cid, userId }: { conversationId: number; userId: number }) => {
      if (String(cid) !== conversationId) return
      setTypingUserId((prev) => (prev === String(userId) ? null : prev))
    }

    socket.on('typing:start', handleStart)
    socket.on('typing:stop', handleStop)
    return () => {
      socket.off('typing:start', handleStart)
      socket.off('typing:stop', handleStop)
      setTypingUserId(null) // đổi conversation — reset trạng thái cũ
    }
  }, [conversationId])

  // throttle: emit start ngay, tự emit stop sau 3s không gõ tiếp
  const notifyTyping = useCallback(() => {
    const socket = getSocket()

    if (!socket || !conversationId) return
    
    socket.emit('typing:start', { conversationId: Number(conversationId) })
    if (stopTimerRef.current) clearTimeout(stopTimerRef.current)

    stopTimerRef.current = setTimeout(() => {
      socket.emit('typing:stop', { conversationId: Number(conversationId) })
    }, 2500)
  }, [conversationId])

  const notifyStopTyping = useCallback(() => {
    const socket = getSocket()
    if (!socket || !conversationId) return
    if (stopTimerRef.current) clearTimeout(stopTimerRef.current)
    socket.emit('typing:stop', { conversationId: Number(conversationId) })
  }, [conversationId])

  return { typingUserId, notifyTyping, notifyStopTyping }
}