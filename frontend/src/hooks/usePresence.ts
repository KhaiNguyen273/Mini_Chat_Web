// src/hooks/usePresence.ts
import { useState, useEffect, useCallback } from 'react'
import { getSocket } from '../socket/socketClient'

export function usePresenceState() {
  const [onlineIds, setOnlineIds] = useState<Set<string>>(new Set())
  const [lastSeenMap, setLastSeenMap] = useState<Record<string, string>>({}) // mới
  const [socketTick, setSocketTick] = useState(0)

  useEffect(() => {
    const socket = getSocket()
    if (!socket) {
      const timer = setTimeout(() => setSocketTick((t) => t + 1), 500)
      return () => clearTimeout(timer)
    }

    const handleOnline = ({ userId }: { userId: number }) => {
      setOnlineIds((prev) => {
        const next = new Set(prev)
        next.add(String(userId))
        return next
      })
    }

    const handleOffline = ({ userId, lastSeenAt }: { userId: number; lastSeenAt: string }) => {
      setOnlineIds((prev) => {
        const next = new Set(prev)
        next.delete(String(userId))
        return next
      })
      // mới — lưu lại mốc thời gian offline để hiển thị "Hoạt động X trước"
      setLastSeenMap((prev) => ({ ...prev, [String(userId)]: lastSeenAt }))
    }

    socket.on('presence:online', handleOnline)
    socket.on('presence:offline', handleOffline)
    return () => {
      socket.off('presence:online', handleOnline)
      socket.off('presence:offline', handleOffline)
    }
  }, [socketTick])


  const seedOnlineStatus = useCallback((userId: string, isOnline: boolean, lastSeenAt?: string | null) => {
    setOnlineIds((prev) => {
      const next = new Set(prev)
      if (isOnline) next.add(userId)
      else next.delete(userId)
      return next
    })
    // mới — seed luôn last_seen_at từ REST nếu có (kể cả khi đang online,
    // để sẵn dữ liệu phòng khi họ offline ngay sau đó mà chưa kịp nhận
    // socket presence:offline mới)
    if (lastSeenAt) {
      setLastSeenMap((prev) => ({ ...prev, [userId]: lastSeenAt }))
    }
  }, [])

  const isOnline = useCallback((userId?: string | null) => {
    if (!userId) return false
    return onlineIds.has(String(userId))
  }, [onlineIds])

  // mới — trả về last_seen_at thô, để nơi dùng tự format theo formatLastSeen
  const getLastSeen = useCallback((userId?: string | null): string | null => {
    if (!userId) return null
    return lastSeenMap[String(userId)] || null
  }, [lastSeenMap])

  return { isOnline, seedOnlineStatus,getLastSeen  }
}