// src/types/auth.types.ts
export interface User {
  id: string
  phone: string
  name: string
  bio?: string
  avatar_url?: string
}

export interface LoginPayload {
  phone: string
  password: string
}

export interface RegisterPayload {
  phone: string
  password: string
  name: string
}

// refreshToken không còn nằm trong response nữa — nó nằm trong httpOnly cookie
export interface LoginResponse {
  accessToken: string
  user: User
}

export interface RefreshResponse {
  accessToken: string
}
