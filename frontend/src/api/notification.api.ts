// src/api/notification.api.ts
import axiosClient from './axiosClient'
import type { Notification } from '../types/notification.types'

export const getNotificationsApi = () =>
  axiosClient
    .get<{ data: Notification[] }>('/notifications')
    .then((res) => res.data.data)

export const markNotificationReadApi = (id: string) =>
  axiosClient.put(`/notifications/${id}/read`)

export const markAllNotificationsReadApi = () =>
  axiosClient.put('/notifications/read-all')