// src/socket/socketClient.ts
import { io, type Socket } from 'socket.io-client'
import { getAccessToken } from '../utils/tokenStorage'

const SOCKET_URL = (import.meta.env.VITE_API_URL || 'http://localhost:5000/api').replace(/\/api\/?$/, '')

let socket: Socket | null = null

export function connectSocket(): Socket {
  const token = getAccessToken()
  if (socket) {
    socket.auth = { token }
    if (!socket.connected) socket.connect()
    return socket
  }
  socket = io(SOCKET_URL, { auth: { token } })
  return socket
}

// gọi sau mỗi lần refresh accessToken thành công — reconnect để socket dùng token mới,
// vì socket không tự re-verify token giữa chừng
export function reconnectSocketWithNewToken() {
  if (!socket) return
  socket.auth = { token: getAccessToken() }
  socket.disconnect()
  socket.connect()
}

export function disconnectSocket() {
  socket?.disconnect()
  socket = null
}

export function getSocket(): Socket | null {
  return socket
}