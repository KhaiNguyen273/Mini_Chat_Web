// useConversationDetail.ts
import { useState, useEffect, useCallback } from 'react'
import { getConversationByIdApi, getConversationMembersApi } from '../api/conversation.api'
import type { Conversation, ConversationMember } from '../types/conversation.types'
import { DEFAULT_AVATAR_URL } from '../constants'
import { getSocket } from '../socket/socketClient'
import { useAuth } from './useAuth'
import { usePresenceContext } from '../contexts/PresenceContext'

export function useConversationDetail(conversationId: string) {
  const { user } = useAuth()
  const { seedOnlineStatus } = usePresenceContext()
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [members, setMembers] = useState<ConversationMember[]>([])
  const [loading, setLoading] = useState(true)

  const fetchDetail = useCallback(async () => {
    setLoading(true)
    try {
      const [conv, mem] = await Promise.all([
        getConversationByIdApi(conversationId),
        getConversationMembersApi(conversationId),
      ])
      setConversation(conv)
      setMembers(mem)

      if (conv.type === 'private' && conv.other_user_id) {
        seedOnlineStatus(conv.other_user_id, !!conv.is_online, conv.last_seen_at)
      }
      mem.forEach((m) => seedOnlineStatus(m.id, !!m.is_online, m.last_seen_at))
    } finally {
      setLoading(false)
    }
  }, [conversationId, seedOnlineStatus])

  useEffect(() => {
    let cancelled = false
    fetchDetail().catch(() => {})
    return () => { cancelled = true }
  }, [fetchDetail])

  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    const handleStatus = ({ conversationId: cid, status }: { conversationId: number; status: string }) => {
      if (String(cid) !== conversationId) return
      setConversation((prev) => (prev ? { ...prev, status } : prev))
    }

    socket.on('conversation:status', handleStatus)
    return () => { socket.off('conversation:status', handleStatus) }
  }, [conversationId])

  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    const handleUpdated = (data: { conversationId: number; name: string; avatar_url: string | null }) => {
      if (String(data.conversationId) !== conversationId) return
      setConversation((prev) => (prev ? { ...prev, name: data.name, avatar_url: data.avatar_url ?? undefined } : prev))
    }

    socket.on('conversation:updated', handleUpdated)
    return () => { socket.off('conversation:updated', handleUpdated) }
  }, [conversationId])

  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    const handleRead = ({ conversationId: cid, userId, lastReadAt }: { conversationId: number; userId: number; lastReadAt: string }) => {
      if (String(cid) !== conversationId) return
      setMembers((prev) =>
        prev.map((m) => (String(m.id) === String(userId) ? { ...m, last_read_at: lastReadAt } : m))
      )
    }

    socket.on('conversation:read', handleRead)
    return () => { socket.off('conversation:read', handleRead) }
  }, [conversationId])

  useEffect(() => {
    const socket = getSocket()
    if (!socket || !user) return

    const handleNewMessage = (msg: any) => {
      if (String(msg.conversation_id) !== conversationId) return
      if (msg.type !== 'system' || !msg.system_meta) return

      const isAboutMe = String(msg.system_meta.targetUserId) === String(user.id)
      if (!isAboutMe) return

      if (msg.system_meta.event === 'kicked') {
        setConversation((prev) => (prev ? { ...prev, is_member: false } : prev))
      } else if (msg.system_meta.event === 'added') {
        setConversation((prev) => (prev ? { ...prev, is_member: true } : prev))
      }
    }

    socket.on('message:new', handleNewMessage)
    return () => { socket.off('message:new', handleNewMessage) }
  }, [conversationId, user])

  // thêm vào cạnh các listener socket khác trong useConversationDetail.ts
  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    const handleRoleChanged = ({ conversationId: cid, userId, role }: { conversationId: number; userId: number; actorId: number; role: string }) => {
      if (String(cid) !== conversationId) return
      setMembers((prev) =>
        prev.map((m) => (String(m.id) === String(userId) ? { ...m, role: role as 'admin' | 'member' } : m))
      )
    }

    socket.on('conversation:role-changed', handleRoleChanged)
    return () => { socket.off('conversation:role-changed', handleRoleChanged) }
  }, [conversationId])


  const displayName = conversation?.name || 'Đang tải...'
  const displayAvatar = conversation?.avatar_url||DEFAULT_AVATAR_URL

  const getAvatarBySender = (senderId: string) =>
    members.find((m) => String(m.id) === String(senderId))?.avatar_url

  const isBlockedByOther = !!conversation?.is_blocked_by_other

  return {
    conversation,
    members,
    loading,
    displayName,
    displayAvatar,
    getAvatarBySender,
    isBlockedByOther,
    refetch: fetchDetail,
  }
}

export type ConversationDetail = ReturnType<typeof useConversationDetail>