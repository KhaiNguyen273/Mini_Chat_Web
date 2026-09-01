import { useState, useEffect } from 'react'
import { getSocket } from '../socket/socketClient'

// theo dõi conversation nào đang có người gõ — dùng cho sidebar, không cần biết ai gõ
export function useSidebarTyping() {
  const [typingConversations, setTypingConversations] = useState<Set<string>>(new Set())

  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    const handleStart = ({ conversationId }: { conversationId: number }) => {
      setTypingConversations((prev) => new Set(prev).add(String(conversationId)))
    }
    const handleStop = ({ conversationId }: { conversationId: number }) => {
      setTypingConversations((prev) => {
        const next = new Set(prev)
        next.delete(String(conversationId))
        return next
      })
    }

    socket.on('typing:start', handleStart)
    socket.on('typing:stop', handleStop)
    return () => {
      socket.off('typing:start', handleStart)
      socket.off('typing:stop', handleStop)
    }
    
  }, [])

  return typingConversations
}