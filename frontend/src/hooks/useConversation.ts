// src/hooks/useConversation.ts — bản đầy đủ, đã sửa đúng theo userId hiện tại
import { useState, useEffect, useCallback, useRef } from 'react'
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
import { getSocket } from '../socket/socketClient'
import { useAuth } from './useAuth'

function upsertById(list: Conversation[], item: Conversation): Conversation[] {
  const filtered = list.filter((c) => String(c.id) !== String(item.id))
  return [item, ...filtered]
}

export function useConversation() {
  const { user } = useAuth()
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const conversationsRef = useRef<Conversation[]>([])
  useEffect(() => { conversationsRef.current = conversations }, [conversations])

  const fetchConversations = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setConversations(await getConversationsApi())
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không tải được danh sách đoạn chat')
    } finally {
      setLoading(false)
    }
  }, [])

  const openPrivateConversation = async (otherUserId: string) => {
    const conv = await createPrivateConversationApi(otherUserId)
    if (conv.status === 'active') {
      setConversations((prev) => upsertById(prev, conv))
    }
    return conv
  }

  const createGroup = async (payload: CreateGroupPayload) => {
    const conv = await createGroupConversationApi(payload)
    setConversations((prev) => upsertById(prev, conv))
    return conv
  }

  const updateConversation = async (id: string, payload: UpdateConversationPayload) => {
    const updated = await updateConversationApi(id, payload)
    setConversations((prev) => prev.map((c) => (String(c.id) === String(id) ? updated : c)))
    return updated
  }

  const markAsRead = async (id: string) => {
    const optimisticNow = new Date().toISOString()
    setConversations((prev) =>
      prev.map((c) => (String(c.id) === String(id) ? { ...c, last_read_at: optimisticNow } : c))
    )
    try {
      const lastReadAt = await markConversationReadApi(id)
      if (lastReadAt) {
        setConversations((prev) =>
          prev.map((c) => (String(c.id) === String(id) ? { ...c, last_read_at: lastReadAt } : c))
        )
      }
    } catch {
      // lỗi mạng — giữ nguyên optimistic, lần đọc tiếp theo hoặc F5 sẽ tự đồng bộ
    }
  }

  const toggleMute = async (id: string, muted: boolean) => {
    await muteConversationApi(id, muted)
    setConversations((prev) => prev.map((c) => (String(c.id) === String(id) ? { ...c, muted } : c)))
  }

  const getMembers = async (id: string): Promise<ConversationMember[]> => {
    return getConversationMembersApi(id)
  }

  const addMember = async (id: string, userId: string) => {
    await addConversationMemberApi(id, userId)
  }

  const removeMember = async (id: string, userId: string, newAdminId?: string) => {
    await removeConversationMemberApi(id, userId, newAdminId)
  }

  const changeMemberRole = async (id: string, userId: string, role: 'admin' | 'member') => {
    await updateMemberRoleApi(id, userId, role)
  }

  const removeConversationLocally = (id: string) => {
    setConversations((prev) => prev.filter((c) => String(c.id) !== String(id)))
  }

  const touchConversation = (
    id: string,
    message: { content: string | null; type: string; sender_id: string; created_at: string }
  ): boolean => {
    const exists = conversationsRef.current.some((c) => String(c.id) === String(id))
    if (!exists) return false
    setConversations((prev) => {
      const idx = prev.findIndex((c) => String(c.id) === String(id))
      if (idx === -1) return prev
      const updated = { ...prev[idx], last_message: message, updated_at: message.created_at }
      const rest = prev.filter((_, i) => i !== idx)
      return [updated, ...rest]
    })
    return true
  }

  useEffect(() => {
    fetchConversations()
  }, [fetchConversations])

  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    const handleNewMessage = (msg: any) => {
      setConversations((prev) => {
        const idx = prev.findIndex((c) => String(c.id) === String(msg.conversation_id))
        if (idx === -1) return prev
        const updated = {
          ...prev[idx],
          last_message: {
            content: msg.content,
            type: msg.type,
            sender_id: String(msg.sender_id),
            created_at: msg.created_at,
          },
          updated_at: msg.created_at,
        }
        const rest = prev.filter((_, i) => i !== idx)
        return [updated, ...rest]
      })
    }

    socket.on('message:new', handleNewMessage)
    return () => { socket.off('message:new', handleNewMessage) }
  }, [])

  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    const handleNewConversation = (conv: any) => {
      if (conv.status === 'pending') return
      const normalized: Conversation = {
        ...conv,
        id: String(conv.id),
        other_user_id: conv.other_user_id ? String(conv.other_user_id) : null,
      }
      setConversations((prev) => upsertById(prev, normalized))
    }

    socket.on('conversation:new', handleNewConversation)
    return () => { socket.off('conversation:new', handleNewConversation) }
  }, [])

  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    const handleStatus = ({ conversationId, status }: { conversationId: number; status: string }) => {
      setConversations((prev) =>
        prev.map((c) => (String(c.id) === String(conversationId) ? { ...c, status } : c))
      )
    }

    socket.on('conversation:status', handleStatus)
    return () => { socket.off('conversation:status', handleStatus) }
  }, [])

  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    const handleUpdated = (data: { conversationId: number; name: string; avatar_url: string | null }) => {
      setConversations((prev) =>
        prev.map((c) =>
          String(c.id) === String(data.conversationId)
            ? { ...c, name: data.name, avatar_url: data.avatar_url ?? undefined }
            : c
        )
      )
    }

    socket.on('conversation:updated', handleUpdated)
    return () => { socket.off('conversation:updated', handleUpdated) }
  }, [])

  // MỚI — chỉ cập nhật last_read_at (dùng cho sidebar bold) khi CHÍNH MÌNH
  // là người vừa đọc (userId trong payload trùng với mình), tránh đọc của
  // người khác ảnh hưởng nhầm tới trạng thái unread của chính mình
  useEffect(() => {
    const socket = getSocket()
    if (!socket || !user) return

    const handleRead = ({ conversationId, userId, lastReadAt }: { conversationId: number; userId: number; lastReadAt: string }) => {
      if (String(userId) !== String(user.id)) return
      setConversations((prev) =>
        prev.map((c) => (String(c.id) === String(conversationId) ? { ...c, last_read_at: lastReadAt } : c))
      )
    }

    socket.on('conversation:read', handleRead)
    return () => { socket.off('conversation:read', handleRead) }
  }, [user])

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
    removeConversationLocally,
    touchConversation,
    refetch: fetchConversations,
  }
}