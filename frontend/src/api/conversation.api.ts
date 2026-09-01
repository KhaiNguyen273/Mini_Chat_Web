// src/api/conversation.api.ts
import axiosClient from './axiosClient'
import type {
  Conversation,
  ConversationMember,
  CreateGroupPayload,
  UpdateConversationPayload,
} from '../types/conversation.types'
import type { MutualGroup } from '../types/mutual.types'

export const createPrivateConversationApi = (otherUserId: string) =>
  axiosClient
    .post<{ data: any }>('/conversations/private', { otherUserId })
    .then((res) => ({
      ...res.data.data,
      id: String(res.data.data.id),
      other_user_id: res.data.data.other_user_id ? String(res.data.data.other_user_id) : null,
    })) as Promise<Conversation>

export const createGroupConversationApi = (payload: CreateGroupPayload) =>
  axiosClient
    .post<{ data: any }>('/conversations/group', payload)
    .then((res) => ({ ...res.data.data, id: String(res.data.data.id) })) as Promise<Conversation>

export const getConversationsApi = () =>
  axiosClient
    .get<{ data: any[] }>('/conversations')
    .then((res) =>
      res.data.data.map((c) => ({
        ...c,
        id: String(c.id),
        other_user_id: c.other_user_id ? String(c.other_user_id) : null,
        is_blocked_by_other: !!c.is_blocked_by_other,
      })) as Conversation[]
    )

export const getConversationByIdApi = (id: string) =>
  axiosClient.get<{ data: any }>(`/conversations/${id}`).then((res) => ({
    ...res.data.data,
    id: String(res.data.data.id),
    other_user_id: res.data.data.other_user_id ? String(res.data.data.other_user_id) : null,
    is_blocked_by_other: !!res.data.data.is_blocked_by_other,
    is_member: res.data.data.is_member !== false, // mặc định true nếu BE chưa trả (phòng hờ)
  })) as Promise<Conversation>

export const updateConversationApi = (id: string, payload: UpdateConversationPayload) =>
  axiosClient
    .put<{ data: any }>(`/conversations/${id}`, payload)
    .then((res) => ({ ...res.data.data, id: String(res.data.data.id) })) as Promise<Conversation>

export const markConversationReadApi = (id: string) =>
  axiosClient.put<{ data: { lastReadAt: string | null } }>(`/conversations/${id}/read`)
    .then((res) => res.data.data.lastReadAt)

export const muteConversationApi = (id: string, muted: boolean) =>
  axiosClient.put(`/conversations/${id}/mute`, { muted })

export const getConversationMembersApi = (id: string) =>
  axiosClient
    .get<{ data: ConversationMember[] }>(`/conversations/${id}/members`)
    .then((res) => res.data.data)

export const addConversationMemberApi = (id: string, userId: string) =>
  axiosClient.post(`/conversations/${id}/members`, { userId })

// mới — hỗ trợ newAdminId khi admin duy nhất tự rời nhóm còn người khác
export const removeConversationMemberApi = (id: string, userId: string, newAdminId?: string) =>
  axiosClient.delete(`/conversations/${id}/members/${userId}`, {
    data: newAdminId ? { newAdminId } : undefined,
  })

export const updateMemberRoleApi = (id: string, userId: string, role: 'admin' | 'member') =>
  axiosClient.put(`/conversations/${id}/members/${userId}/role`, { role })

export const getPendingConversationsApi = () =>
  axiosClient.get<{ data: Conversation[] }>('/conversations/pending').then((res) => res.data.data)

export const acceptPendingApi = (id: string) =>
  axiosClient.put<{ data: { id: string; status: string } }>(`/conversations/${id}/accept`).then((res) => res.data.data)

export const rejectPendingApi = (id: string) =>
  axiosClient.put<{ data: { id: string; status: string } }>(`/conversations/${id}/reject`).then((res) => res.data.data)

export const getMutualGroupsApi = (otherUserId: string) =>
  axiosClient.get<{ data: any[] }>(`/conversations/mutual-groups/${otherUserId}`).then((res) =>
    res.data.data.map((g) => ({ ...g, id: String(g.id) })) as MutualGroup[]
  )

export const getPrivateConversationIdApi = (otherUserId: string) =>
  axiosClient.get<{ data: { conversationId: number | null } }>(`/conversations/private-id/${otherUserId}`)
    .then((res) => res.data.data.conversationId ? String(res.data.data.conversationId) : null)