// src/api/message.api.ts
import axiosClient from './axiosClient'
import type { Message, MessageReadBy, MessageType } from '../types/message.types'

export interface GetMessagesResult {
  messages: Message[]
  nextCursor: string | null // created_at của tin cuối cùng, dùng cho lần load tiếp theo
}

// message.api.ts — sửa getMessagesApi, ép id về string ngay khi nhận response
export const getMessagesApi = async (
  conversationId: string,
  cursor?: string,
  limit = 30,
  q?: string
): Promise<GetMessagesResult> => {
  const res = await axiosClient.get<{ data: any[] }>(
    `/conversations/${conversationId}/messages`,
    { params: { cursor, limit, q } }
  )
  const messages: Message[] = res.data.data.map((m) => ({
    ...m,
    id: String(m.id),
    sender_id: String(m.sender_id),
  }))
  const nextCursor = messages.length < limit ? null : messages[messages.length - 1]?.created_at || null

  return { messages, nextCursor }
}

// message.api.ts — sendMessageApi cũng cần ép kiểu tương tự
export const sendMessageApi = (
  conversationId: string,
  content: string,
  type: MessageType,
  files: File[] = []
) => {
  const formData = new FormData()
  formData.append('content', content)
  formData.append('type', type)
  files.forEach((f) => formData.append('files', f))

  return axiosClient
    .post<{ data: any }>(`/conversations/${conversationId}/messages/upload`, formData)
    .then((res) => ({
      ...res.data.data,
      id: String(res.data.data.id),
      sender_id: String(res.data.data.sender_id),
    }))
}

export const deleteMessageApi = (messageId: string) =>
  axiosClient.delete(`/messages/${messageId}`)

export const editMessageApi = (messageId: string, content: string) =>
  axiosClient.put<{ data: Message }>(`/messages/${messageId}`, { content }).then((res) => res.data.data)

export const markMessageReadApi = (messageId: string) =>
  axiosClient.post(`/messages/${messageId}/read`)

export const getMessageReadsApi = (messageId: string) =>
  axiosClient
    .get<{ data: MessageReadBy[] }>(`/messages/${messageId}/reads`)
    .then((res) => res.data.data)

export const getMessageByIdApi = (messageId: string) =>
  axiosClient.get<{ data: any }>(`/messages/${messageId}`).then((res) => ({
    ...res.data.data,
    id: String(res.data.data.id),
    conversation_id: String(res.data.data.conversation_id),
    sender_id: String(res.data.data.sender_id),
  }))

export const getMessagesAfterApi = async (conversationId: string, after: string, limit = 15) => {
  const res = await axiosClient.get<{ data: any[] }>(
    `/conversations/${conversationId}/messages/after`,
    { params: { after, limit } }
  )
  return res.data.data.map((m) => ({
    ...m,
    id: String(m.id),
    sender_id: String(m.sender_id),
  })) as Message[]
}