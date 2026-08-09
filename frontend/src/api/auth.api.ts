// src/api/auth.api.ts
import axiosClient from './axiosClient'
import type { LoginPayload, LoginResponse, RegisterPayload, User } from '../types/auth.types'

export const registerApi = (payload: RegisterPayload) =>
  axiosClient.post<{ data: User }>('/auth/register', payload).then((res) => res.data.data)

export const loginApi = (payload: LoginPayload) =>
  axiosClient.post<{ data: LoginResponse }>('/auth/login', payload).then((res) => res.data.data)

// không truyền refreshToken nữa — backend tự đọc từ cookie
export const logoutApi = () => axiosClient.post('/auth/logout')

export const getMeApi = () =>
  axiosClient.get<{ data: User }>('/users/me').then((res) => res.data.data)