// src/hooks/useMarkAsRead.ts
import { useRef, useCallback } from 'react'
import { useConversationContext } from '../contexts/ConversationContext'

// Quy tắc:
// 1. Bấm vào conversation đang có tin chưa đọc -> đánh dấu đã đọc ngay.
// 2. Đang mở sẵn, có tin mới tới thụ động -> KHÔNG tự đánh dấu.
// 3. Chỉ đánh dấu lại khi có hành động CHỦ ĐỘNG: gõ vào input, hoặc rời đi
//    rồi quay lại (tương đương case 1, xử lý ở nơi khác qua unmount/mount).
export function useMarkAsRead(conversationId: string) {
  const { markAsRead } = useConversationContext()
  const markedRef = useRef(false)
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // gọi khi mount (bấm vào conversation lần đầu) — luôn đánh dấu 1 lần
  const markOnOpen = useCallback(() => {
    if (markedRef.current) return
    markedRef.current = true
    markAsRead(conversationId).catch(() => {})
  }, [conversationId, markAsRead])

  const markOnActiveAction = useCallback(() => {
    if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)
    debounceTimerRef.current = setTimeout(() => {
      markAsRead(conversationId).catch(() => {})
    }, 800)
  }, [conversationId, markAsRead])

  return { markOnOpen, markOnActiveAction }
}