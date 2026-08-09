// src/types/user.types.ts
import type { User } from './auth.types'

export interface UpdateProfilePayload {
  name?: string
  bio?: string
  avatar_url?: string
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

export type { User }