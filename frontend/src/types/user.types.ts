// src/types/user.types.ts
import type { User as BaseUser } from './auth.types'

export interface User extends BaseUser {
  is_online?: boolean
  last_seen_at?: string | null
  is_deactivated?: boolean // mới
}

export interface UpdateProfilePayload {
  name?: string
  bio?: string
  avatar_url?: string | null
}

export interface ChangePasswordPayload {
  oldPassword: string
  newPassword: string
}

export interface SearchUserResult {
  id: string
  phone: string
  name: string
  avatar_url?: string
}

export interface UploadAvatarResponse {
  avatar_url: string
}