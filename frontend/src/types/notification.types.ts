// src/types/notification.types.ts
export type NotificationType = 'friend_request' | 'friend_accepted' | 'new_message' | 'pending_message'

export interface NotificationActor {
  id: string
  name: string
  avatar_url?: string
} 

export interface Notification {
  id: string
  type: NotificationType
  reference_id: string
  reference_type: string
  conversation_id: string | null // mới
  is_read: boolean
  created_at: string
  preview: string
  actor: NotificationActor | null
}