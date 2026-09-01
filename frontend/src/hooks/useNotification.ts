// src/hooks/useNotification.ts
import { useState, useEffect, useCallback } from 'react'
import {
  getNotificationsApi,
  markNotificationReadApi,
  markAllNotificationsReadApi,
} from '../api/notification.api'
import type { Notification } from '../types/notification.types'
import { getSocket } from '../socket/socketClient'

export function useNotification() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchNotifications = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setNotifications(await getNotificationsApi())
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không tải được thông báo')
    } finally {
      setLoading(false)
    }
  }, [])

  const markAsRead = async (id: string) => {
    // cập nhật UI ngay, không chờ API — cảm giác nhanh hơn
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: true } : n)))
    try {
      await markNotificationReadApi(id)
    } catch {
      // rollback nếu API lỗi
      setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, is_read: false } : n)))
    }
  }

  const markAllAsRead = async () => {
    const prevState = notifications
    setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    try {
      await markAllNotificationsReadApi()
    } catch {
      setNotifications(prevState)
    }
  }

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  // notification:new — có thông báo mới bất kỳ loại nào, kể cả pending_message
  // (bị lọc khỏi hiển thị ở dưới, nhưng vẫn cần nhận để khỏi bị lệch state khi
  // sau này conversation đó bị xoá notification thì còn cái để xoá theo)
  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    const handleNew = (n: any) => {
      setNotifications((prev) => (prev.some((x) => x.id === String(n.id)) ? prev : [{ ...n, id: String(n.id) }, ...prev]))
    }

    socket.on('notification:new', handleNew)
    return () => { socket.off('notification:new', handleNew) }
  }, [])

  // notification:read — đồng bộ đa tab khi 1 noti được đánh dấu đã đọc ở tab khác
  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    const handleRead = ({ id }: { id: number }) => {
      setNotifications((prev) => prev.map((n) => (n.id === String(id) ? { ...n, is_read: true } : n)))
    }

    socket.on('notification:read', handleRead)
    return () => { socket.off('notification:read', handleRead) }
  }, [])

  // notification:read-all — đồng bộ đa tab
  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    const handleReadAll = () => {
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })))
    }

    socket.on('notification:read-all', handleReadAll)
    return () => { socket.off('notification:read-all', handleReadAll) }
  }, [])

  // notification:removed — pending_message bị xoá khi conversation được accept/reject
  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    const handleRemoved = ({ type, reference_type, reference_id }: { type: string; reference_type: string; reference_id: number }) => {
      setNotifications((prev) =>
        prev.filter((n) => !(n.type === type && n.reference_type === reference_type && n.reference_id === String(reference_id)))
      )
    }

    socket.on('notification:removed', handleRemoved)
    return () => { socket.off('notification:removed', handleRemoved) }
  }, [])

  const markConversationNotificationsRead = async (conversationId: string) => {
    const toMark = notifications.filter(
      (n) => !n.is_read && (n.conversation_id === conversationId)
    )
    for (const n of toMark) {
      await markAsRead(n.id)
    }
  }

  const visibleNotifications = notifications.filter((n) => n.type !== 'pending_message')
  const unreadCount = visibleNotifications.filter((n) => !n.is_read).length

  return {
    notifications: visibleNotifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
    markConversationNotificationsRead
  }
}