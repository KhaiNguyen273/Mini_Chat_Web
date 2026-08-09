// src/api/user.api.ts
import axiosClient from './axiosClient'
import type {
  User,
  UpdateProfilePayload,
  ChangePasswordPayload,
  SearchUserResult,
  UploadAvatarResponse,
} from '../types/user.types'

export const getMeApi = () =>
  axiosClient.get<{ data: User }>('/users/me').then((res) => res.data.data)

export const updateProfileApi = (payload: UpdateProfilePayload) =>
  axiosClient.put<{ data: User }>('/users/me', payload).then((res) => res.data.data)

export const changePasswordApi = (payload: ChangePasswordPayload) =>
  axiosClient.put('/users/me/password', payload)

export const deleteAccountApi = () => axiosClient.delete('/users/me')

export const getUserByIdApi = (id: string) =>
  axiosClient.get<{ data: User }>(`/users/${id}`).then((res) => res.data.data)

// FormData — KHÔNG set Content-Type thủ công, để browser tự set boundary
export const uploadAvatarApi = (file: File) => {
  const formData = new FormData()
  formData.append('avatar', file)
  return axiosClient
    .post<{ data: UploadAvatarResponse }>('/users/me/avatar', formData)
    .then((res) => res.data.data)
}