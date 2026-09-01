import axiosClient from './axiosClient'

export const uploadImageApi = (file: File) => {
  const formData = new FormData()
  formData.append('file', file)
  return axiosClient
    .post<{ data: { url: string; public_id: string; bytes: number; format: string } }>('/uploads/image', formData)
    .then((res) => res.data.data)
}