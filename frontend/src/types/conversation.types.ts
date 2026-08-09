export type ConversationType = 'private' | 'group'
export type MemberRole = 'admin' | 'member'

export interface ConversationMember {
  id: string
  name: string
  avatar_url?: string
  role: MemberRole
  joined_at: string
}

export interface Conversation {
  id: string
  type: ConversationType
  status: 'active' | 'pending' | 'rejected'
  created_by: string
  created_at: string
  updated_at: string
  name: string           // đã tính sẵn ở BE — private: tên người kia, group: tên nhóm
  avatar_url?: string    // đã tính sẵn tương tự
  other_user_id: string | null  // chỉ có giá trị khi type = "private"
  last_read_at?: string
  muted?: boolean
  last_message?: {
    content: string
    sender_id: string
    created_at: string
  }
}

export interface CreateGroupPayload {
  name: string
  memberIds: string[]
}

export interface UpdateConversationPayload {
  name?: string
  avatar_url?: string
}