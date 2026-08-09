// src/api/message.api.ts
import axiosClient from './axiosClient'
import type { Message, MessageReadBy, MessageType } from '../types/message.types'

export interface GetMessagesResult {
  messages: Message[]
  nextCursor: string | null // created_at của tin cuối cùng, dùng cho lần load tiếp theo
}

export const getMessagesApi = async (
  conversationId: string,
  cursor?: string,
  limit = 30
): Promise<GetMessagesResult> => {
  const res = await axiosClient.get<{ data: Message[] }>(
    `/conversations/${conversationId}/messages`,
    { params: { cursor, limit } }
  )
  const messages = res.data.data
  // hết dữ liệu khi trả về ít hơn limit
  const nextCursor =
    messages.length < limit ? null : messages[messages.length - 1]?.created_at || null
  return { messages, nextCursor }
}

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
    .post<{ data: Message }>(`/conversations/${conversationId}/messages/upload`, formData)
    .then((res) => res.data.data)
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