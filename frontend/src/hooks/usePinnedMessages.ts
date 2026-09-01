// src/hooks/usePinnedMessages.ts
import { useState, useCallback, useEffect } from 'react'
import { pinMessageApi, unpinMessageApi, getPinnedMessagesApi } from '../api/pin.api'
import type { PinnedMessage } from '../types/pin.types'
import { getSocket } from '../socket/socketClient'

export function usePinnedMessages(conversationId: string) {
  const [pins, setPins] = useState<PinnedMessage[]>([])
  const [loading, setLoading] = useState(false)

  const fetchPins = useCallback(async () => {
    setLoading(true)
    try {
      setPins(await getPinnedMessagesApi(conversationId))
    } finally {
      setLoading(false)
    }
  }, [conversationId])

  // gọi API, KHÔNG tự set state ở đây nữa — chờ socket "conversation:pin"
  // bắn về (kể cả cho chính người vừa ghim, để đảm bảo mọi nơi cùng 1 nguồn
  // sự thật duy nhất, tránh lệch giữa optimistic-update và dữ liệu thật)
  const pin = async (messageId: string) => {
    await pinMessageApi(conversationId, messageId)
  }

  const unpin = async (messageId: string) => {
    await unpinMessageApi(conversationId, messageId)
  }

  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    const handlePin = (data: { conversationId: number; messageId: number; pinnedBy: { id: number; name: string } }) => {
      if (String(data.conversationId) !== conversationId) return
      // nếu đã có trong danh sách (do fetchPins gọi gần lúc emit tới) thì bỏ qua
      setPins((prev) => {
        if (prev.some((p) => String(p.message.id) === String(data.messageId))) return prev
        // chèn tạm 1 bản ghi tối giản — thiếu content/sender đầy đủ, nhưng
        // đủ để hiển thị số lượng đúng ngay; nếu cần đầy đủ thông tin tin
        // nhắn (nội dung, người gửi) để hiện trong PinnedMessagesModal ngay
        // lập tức không cần đợi fetch lại, cần refetch — xem cách gọi ở dướiMessageItem.tsx
        return prev
      })
      // Đơn giản và an toàn nhất: refetch lại danh sách đầy đủ từ server
      // ngay khi có sự kiện pin mới — vì object PinnedMessage cần nhiều field
      // (content, sender, thời gian) mà socket không gửi kèm, tự ráp tay dễ
      // thiếu/sai hơn là gọi lại 1 API rẻ tiền này.
      fetchPins()
    }

    const handleUnpin = (data: { conversationId: number; messageId: number }) => {
      if (String(data.conversationId) !== conversationId) return
      setPins((prev) => prev.filter((p) => String(p.message.id) !== String(data.messageId)))
    }

    socket.on('conversation:pin', handlePin)
    socket.on('conversation:unpin', handleUnpin)
    return () => {
      socket.off('conversation:pin', handlePin)
      socket.off('conversation:unpin', handleUnpin)
    }
  }, [conversationId, fetchPins])

  return { pins, loading, fetchPins, pin, unpin }
}