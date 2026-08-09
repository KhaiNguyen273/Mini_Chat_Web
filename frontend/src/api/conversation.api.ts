// src/api/conversation.api.ts
import axiosClient from './axiosClient'
import type {
  Conversation,
  ConversationMember,
  CreateGroupPayload,
  UpdateConversationPayload,
} from '../types/conversation.types'

export const createPrivateConversationApi = (otherUserId: string) =>
  axiosClient
    .post<{ data: Conversation }>('/conversations/private', { otherUserId })
    .then((res) => res.data.data)

export const createGroupConversationApi = (payload: CreateGroupPayload) =>
  axiosClient
    .post<{ data: Conversation }>('/conversations/group', payload)
    .then((res) => res.data.data)

export const getConversationsApi = () =>
  axiosClient
    .get<{ data: Conversation[] }>('/conversations')
    .then((res) => res.data.data)

export const getConversationByIdApi = (id: string) =>
  axiosClient
    .get<{ data: Conversation }>(`/conversations/${id}`)
    .then((res) => res.data.data)

export const updateConversationApi = (id: string, payload: UpdateConversationPayload) =>
  axiosClient
    .put<{ data: Conversation }>(`/conversations/${id}`, payload)
    .then((res) => res.data.data)

export const markConversationReadApi = (id: string) =>
  axiosClient.put(`/conversations/${id}/read`)

export const muteConversationApi = (id: string, muted: boolean) =>
  axiosClient.put(`/conversations/${id}/mute`, { muted })

export const getConversationMembersApi = (id: string) =>
  axiosClient
    .get<{ data: ConversationMember[] }>(`/conversations/${id}/members`)
    .then((res) => res.data.data)

export const addConversationMemberApi = (id: string, userId: string) =>
  axiosClient.post(`/conversations/${id}/members`, { userId })

export const removeConversationMemberApi = (id: string, userId: string) =>
  axiosClient.delete(`/conversations/${id}/members/${userId}`)

export const updateMemberRoleApi = (id: string, userId: string, role: 'admin' | 'member') =>
  axiosClient.put(`/conversations/${id}/members/${userId}/role`, { role })

export const getPendingConversationsApi = () =>
  axiosClient.get<{ data: Conversation[] }>('/conversations/pending').then((res) => res.data.data)

export const acceptPendingApi = (id: string) =>
  axiosClient.put<{ data: { id: string; status: string } }>(`/conversations/${id}/accept`).then((res) => res.data.data)

export const rejectPendingApi = (id: string) =>
  axiosClient.put<{ data: { id: string; status: string } }>(`/conversations/${id}/reject`).then((res) => res.data.data)