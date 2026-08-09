export type FriendshipStatus = 'pending' | 'accepted' | 'rejected' | 'blocked'
export type ContactRelation = 'none' | 'friend' | 'pending_sent' | 'pending_received' | 'blocked'

export interface Friend {
  id: string
  name: string
  avatar_url?: string
  friendship_id: string
}

export interface FriendRequest {
  id: string          // id bản ghi friendship
  sender_id: string    // id người gửi lời mời — mới thêm
  name: string
  avatar_url?: string
  status: FriendshipStatus
}

export interface CreateFriendshipResponse {
  id: string
  status: FriendshipStatus
}

// kết quả search — backend trả sẵn relation, không cần FE tự suy luận
export interface SearchedContact {
  id: string
  phone: string
  name: string
  avatar_url?: string
  relation: ContactRelation
  friendship_id: string | null
}