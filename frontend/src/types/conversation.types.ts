export type ConversationType = 'private' | 'group'
export type MemberRole = 'admin' | 'member'

export interface ConversationMember {
  id: string
  name: string
  avatar_url?: string
  role: MemberRole
  joined_at: string
  is_muted?: number | boolean
  last_read_at?: string | null
  is_online?: boolean
  last_seen_at?: string | null // mới
}

export interface Conversation {
  id: string
  type: ConversationType
  status: string
  created_by: string
  created_at: string
  updated_at: string
  name: string
  avatar_url?: string
  other_user_id: string | null
  pinned_count: number
  last_message?: {
    content: string | null
    type: string
    sender_id: string
    created_at: string
  }
  is_blocked_by_other: boolean
  is_member: boolean
  last_read_at?: string | null
  is_online?: boolean
  last_seen_at?: string | null // mới
  member_avatars?: string[]
}

export interface CreateGroupPayload {
  name: string
  memberIds: string[]
  avatar_url?: string | null
}

export interface UpdateConversationPayload {
  name?: string
  avatar_url?: string | null
}