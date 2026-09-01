// src/types/media.types.ts
export type MediaCategory = 'image' | 'video' | 'file'

export interface MediaItem {
  id: string
  message_id: string
  file_url: string
  file_name: string
  file_size?: number
  file_type?: string
  category: MediaCategory
  created_at: string
  sender_id: string
  sender_name: string
}

export interface MediaSummary {
  image: number
  video: number
  file: number
}