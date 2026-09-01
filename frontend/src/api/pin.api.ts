// src/api/pin.api.ts
import axiosClient from './axiosClient'
import type { PinnedMessage } from '../types/pin.types'

export const pinMessageApi = (conversationId: string, messageId: string) =>
  axiosClient.post(`/conversations/${conversationId}/pins`, { messageId })

export const unpinMessageApi = (conversationId: string, messageId: string) =>
  axiosClient.delete(`/conversations/${conversationId}/pins/${messageId}`)

export const getPinnedMessagesApi = (conversationId: string) =>
  axiosClient
    .get<{ data: any[] }>(`/conversations/${conversationId}/pins`)
    .then((res) =>
      res.data.data.map((p) => ({
        ...p,
        pin_id: String(p.pin_id),
        pinned_by: { ...p.pinned_by, id: String(p.pinned_by.id) },
        message: {
          ...p.message,
          id: String(p.message.id),           // ← ép kiểu ở đây, chỗ gây bug
          sender: { ...p.message.sender, id: String(p.message.sender.id) },
        },
      })) as PinnedMessage[]
    )