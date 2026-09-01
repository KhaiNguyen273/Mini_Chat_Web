// src/api/block.api.ts
import axiosClient from './axiosClient'
import type { BlockedUser } from '../types/block.types'

export const blockUserApi = (targetId: string) =>
  axiosClient.post<{ data: any }>(`/users/${targetId}/block`).then((res) => ({
    id: String(res.data.data.id),
    blocked_id: String(res.data.data.blocked_id),
  }))

export const unblockUserApi = (targetId: string) =>
  axiosClient.delete<{ data: any }>(`/users/${targetId}/block`).then((res) => ({
    blocked_id: String(res.data.data.blocked_id),
  }))

export const getBlockedListApi = () =>
  axiosClient.get<{ data: any[] }>('/users/blocked').then((res) =>
    res.data.data.map((b) => ({
      ...b,
      id: String(b.id),
      user_id: String(b.user_id),
    })) as BlockedUser[]
  )