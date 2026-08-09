// src/api/axiosClient.ts
import axios from 'axios'
import { getAccessToken, setAccessToken, clearAccessToken } from '../utils/tokenStorage'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api'

const axiosClient = axios.create({
  baseURL: BASE_URL,
  withCredentials: true, // BẮT BUỘC — để browser gửi kèm cookie refreshToken
})

axiosClient.interceptors.request.use((config) => {
  const token = getAccessToken()
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

let isRefreshing = false
let queue: Array<() => void> = []

axiosClient.interceptors.response.use(
  (res) => res,
  async (error) => {
    const originalRequest = error.config
    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error)
    }
    originalRequest._retry = true

    if (isRefreshing) {
      return new Promise((resolve) => {
        queue.push(() => resolve(axiosClient(originalRequest)))
      })
    }

    isRefreshing = true
    try {
      // gọi bằng axios gốc (không phải axiosClient) để tránh dính lại interceptor này
      // vẫn phải withCredentials: true riêng vì instance gốc không kế thừa cấu hình trên
      const { data } = await axios.post(
        `${BASE_URL}/auth/refresh`,
        {},
        { withCredentials: true }
      )
      setAccessToken(data.data.accessToken)
      queue.forEach((cb) => cb())
      queue = []
      return axiosClient(originalRequest)
    } catch (err) {
      clearAccessToken()
      queue = []
      window.location.href = '/login'
      return Promise.reject(err)
    } finally {
      isRefreshing = false
    }
  }
)

export default axiosClient