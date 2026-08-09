// src/hooks/useNotification.ts
import { useState, useEffect, useCallback } from 'react'
import {
  getNotificationsApi,
  markNotificationReadApi,
  markAllNotificationsReadApi,
} from '../api/notification.api'
import type { Notification } from '../types/notification.types'

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

  const unreadCount = notifications.filter((n) => !n.is_read).length

  useEffect(() => {
    fetchNotifications()
  }, [fetchNotifications])

  return {
    notifications,
    unreadCount,
    loading,
    error,
    markAsRead,
    markAllAsRead,
    refetch: fetchNotifications,
  }
}