// src/utils/tokenStorage.ts
// Chỉ còn accessToken cần quản lý ở FE — giữ trong memory (biến module),
// KHÔNG localStorage nữa vì đã không còn giữ refreshToken ở FE.
let accessTokenMemory: string | null = null

export const getAccessToken = () => accessTokenMemory
export const setAccessToken = (token: string) => { accessTokenMemory = token }
export const clearAccessToken = () => { accessTokenMemory = null }