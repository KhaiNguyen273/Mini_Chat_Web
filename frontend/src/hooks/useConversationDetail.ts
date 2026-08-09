import { useState, useEffect } from 'react'
import { getConversationByIdApi, getConversationMembersApi } from '../api/conversation.api'
import type { Conversation, ConversationMember } from '../types/conversation.types'
import { DEFAULT_AVATAR_URL } from '../constants'

export function useConversationDetail(conversationId: string) {
  const [conversation, setConversation] = useState<Conversation | null>(null)
  const [members, setMembers] = useState<ConversationMember[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    Promise.all([
      getConversationByIdApi(conversationId),
      getConversationMembersApi(conversationId),
    ])
      .then(([conv, mem]) => {
        if (cancelled) return
        setConversation(conv)
        setMembers(mem)
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => { cancelled = true }
  }, [conversationId])

  // backend đã trả sẵn name/avatar_url đúng cho cả private lẫn group,
  // không cần tự suy từ members nữa
  const displayName = conversation?.name || 'Đang tải...'
  const displayAvatar = conversation?.avatar_url || DEFAULT_AVATAR_URL

  // vẫn cần members để tra avatar theo từng người gửi trong group
  // useConversationDetail.ts
  const getAvatarBySender = (senderId: string) =>
    members.find((m) => String(m.id) === String(senderId))?.avatar_url || DEFAULT_AVATAR_URL

  return { conversation, members, loading, displayName, displayAvatar, getAvatarBySender }
}

export type ConversationDetail = ReturnType<typeof useConversationDetail>