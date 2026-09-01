// src/api/notification.api.ts
import axiosClient from './axiosClient'
import type { Notification } from '../types/notification.types'

export const getNotificationsApi = () =>
  axiosClient.get<{ data: any[] }>('/notifications').then((res) =>
    res.data.data.map((n) => ({
      ...n,
      id: String(n.id),
      reference_id: String(n.reference_id),
      conversation_id: n.conversation_id ? String(n.conversation_id) : null,
    })) as Notification[]
  )

export const markNotificationReadApi = (id: string) =>
  axiosClient.put(`/notifications/${id}/read`)

export const markAllNotificationsReadApi = () =>
  axiosClient.put('/notifications/read-all')