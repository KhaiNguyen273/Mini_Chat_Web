export type FriendshipStatus = 'pending' | 'accepted' | 'rejected' | 'blocked'
export type ContactRelation = 'none' | 'friend' | 'pending_sent' | 'pending_received' | 'blocked'

export interface Friend {
  id: string
  name: string
  avatar_url?: string
  friendship_id: string
  is_online?: boolean // mới
}

export interface FriendRequest {
  id: string
  sender_id: string
  name: string
  avatar_url?: string
  status: FriendshipStatus
}

export interface CreateFriendshipResponse {
  id: string
  status: FriendshipStatus
}

export interface SearchedContact {
  id: string
  phone: string
  name: string
  avatar_url?: string
  relation: ContactRelation
  friendship_id: string | null
}