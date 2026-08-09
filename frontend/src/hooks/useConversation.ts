// src/hooks/useConversation.ts
import { useState, useEffect, useCallback } from 'react'
import {
  createPrivateConversationApi,
  createGroupConversationApi,
  getConversationsApi,
  updateConversationApi,
  markConversationReadApi,
  muteConversationApi,
  getConversationMembersApi,
  addConversationMemberApi,
  removeConversationMemberApi,
  updateMemberRoleApi,
} from '../api/conversation.api'
import type {
  Conversation,
  ConversationMember,
  CreateGroupPayload,
  UpdateConversationPayload,
} from '../types/conversation.types'

export function useConversation() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchConversations = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      // backend đã sort theo updated_at giảm dần, FE không cần tự sort lại
      setConversations(await getConversationsApi())
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không tải được danh sách đoạn chat')
    } finally {
      setLoading(false)
    }
  }, [])

  // mở/mở lại 1 phòng chat private — backend tự trả về phòng cũ nếu đã tồn tại,
  // nên gọi thoải mái không sợ tạo trùng
  const openPrivateConversation = async (otherUserId: string) => {
    const conv = await createPrivateConversationApi(otherUserId)
    setConversations((prev) => {
      const exists = prev.some((c) => c.id === conv.id)
      return exists ? prev : [conv, ...prev]
    })
    return conv
  }

  const createGroup = async (payload: CreateGroupPayload) => {
    const conv = await createGroupConversationApi(payload)
    setConversations((prev) => [conv, ...prev])
    return conv
  }

  const updateConversation = async (id: string, payload: UpdateConversationPayload) => {
    const updated = await updateConversationApi(id, payload)
    setConversations((prev) => prev.map((c) => (c.id === id ? updated : c)))
    return updated
  }

  const markAsRead = async (id: string) => {
    await markConversationReadApi(id)
    setConversations((prev) =>
      prev.map((c) => (c.id === id ? { ...c, last_read_at: new Date().toISOString() } : c))
    )
  }

  const toggleMute = async (id: string, muted: boolean) => {
    await muteConversationApi(id, muted)
    setConversations((prev) => prev.map((c) => (c.id === id ? { ...c, muted } : c)))
  }

  const getMembers = async (id: string): Promise<ConversationMember[]> => {
    return getConversationMembersApi(id)
  }

  const addMember = async (id: string, userId: string) => {
    await addConversationMemberApi(id, userId)
  }

  const removeMember = async (id: string, userId: string) => {
    await removeConversationMemberApi(id, userId)
  }

  const changeMemberRole = async (id: string, userId: string, role: 'admin' | 'member') => {
    await updateMemberRoleApi(id, userId, role)
  }

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  return {
    conversations,
    loading,
    error,
    openPrivateConversation,
    createGroup,
    updateConversation,
    markAsRead,
    toggleMute,
    getMembers,
    addMember,
    removeMember,
    changeMemberRole,
    refetch: fetchConversations,
  }
}