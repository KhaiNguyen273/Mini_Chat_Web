// src/hooks/useUser.ts
import { useState, useContext } from 'react'
import { AuthContext } from '../stores/authStore'
import {
  updateProfileApi,
  changePasswordApi,
  deleteAccountApi,
  getUserByIdApi,
  uploadAvatarApi,
  getMeApi,
} from '../api/user.api'
import type {
  UpdateProfilePayload,
  ChangePasswordPayload,
  User,
} from '../types/user.types'

export function useUser() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useUser phải dùng trong AuthProvider')
  const { user, setUser } = ctx

  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const updateProfile = async (payload: UpdateProfilePayload) => {
    setLoading(true)
    setError('')
    try {
      const updated = await updateProfileApi(payload)
      setUser(updated) // đồng bộ ngược lại context để toàn app thấy thay đổi
      return updated
    } catch (err: any) {
      setError(err.response?.data?.message || 'Cập nhật thất bại')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const changePassword = async (payload: ChangePasswordPayload) => {
    setLoading(true)
    setError('')
    try {
      await changePasswordApi(payload)
    } catch (err: any) {
      // backend trả 400 nếu oldPassword sai
      setError(err.response?.data?.message || 'Đổi mật khẩu thất bại')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const deleteAccount = async () => {
    setLoading(true)
    setError('')
    try {
      await deleteAccountApi()
    } catch (err: any) {
      setError(err.response?.data?.message || 'Xoá tài khoản thất bại')
      throw err
    } finally {
      setLoading(false)
    }
  }

  const uploadAvatar = async (file: File) => {
    setLoading(true)
    setError('')
    try {
        await uploadAvatarApi(file) // backend tự upload Cloudinary + lưu avatar_url vào DB
        const updated = await getMeApi() // lấy lại user mới nhất, không tự ghép data tay
        setUser(updated)
        return updated
    } catch (err: any) {
        setError(err.response?.data?.message || 'Tải ảnh lên thất bại')
        throw err
    } finally {
        setLoading(false)
    }
    }


  const getUserById = async (id: string): Promise<User> => {
    return getUserByIdApi(id)
  }

  return {
    user,
    loading,
    error,
    updateProfile,
    changePassword,
    deleteAccount,
    uploadAvatar,
    getUserById,
  }
}