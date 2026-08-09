// src/types/message.types.ts
export type MessageType = 'text' | 'image' | 'file'

export interface Attachment {
  file_url: string
  file_name: string
  file_type?: string
  file_size?: number
}

export interface Message {
  id: string
  conversation_id: string
  sender_id: string
  content: string
  type: MessageType
  attachments: Attachment[]
  created_at: string
  updated_at?: string
}

export interface MessageReadBy {
  id: string
  name: string
  avatar_url?: string
  read_at: string
}

export interface SendMessagePayload {
  content: string
  type: MessageType
  files?: File[]
}