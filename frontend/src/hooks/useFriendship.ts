
import { useState, useEffect, useCallback } from 'react'
import {
  sendFriendRequestApi,
  acceptFriendRequestApi,
  rejectFriendRequestApi,
  removeFriendshipApi,
  getFriendsApi,
  getFriendRequestsApi,
  searchUsersApi,
} from '../api/friendship.api'
import type { Friend, FriendRequest, SearchedContact } from '../types/friendship.types'
import { usePresenceContext } from '../contexts/PresenceContext'
import { getSocket } from '../socket/socketClient'

export function useFriendship() {
  const [friends, setFriends] = useState<Friend[]>([])
  const [requests, setRequests] = useState<FriendRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const { seedOnlineStatus } = usePresenceContext()

  const fetchFriends = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const data = await getFriendsApi()
      setFriends(data)
      data.forEach((f) => seedOnlineStatus(f.id, !!f.is_online, f.last_seen_at))
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không tải được danh sách bạn bè')
    } finally {
      setLoading(false)
    }
  }, [seedOnlineStatus])

  const fetchRequests = useCallback(async () => {
    try {
      setRequests(await getFriendRequestsApi())
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không tải được lời mời kết bạn')
    }
  }, [])

  const sendRequest = async (receiverId: string) => {
    try {
      return await sendFriendRequestApi(receiverId)
    } catch (err: any) {
      setError(err.response?.data?.message || 'Gửi lời mời thất bại')
      throw err
    }
  }

  const acceptRequest = async (friendshipId: string) => {
    await acceptFriendRequestApi(friendshipId)
    setRequests((prev) => prev.filter((r) => r.id !== friendshipId))
    await fetchFriends()
  }

  const rejectRequest = async (friendshipId: string) => {
    await rejectFriendRequestApi(friendshipId)
    setRequests((prev) => prev.filter((r) => r.id !== friendshipId))
  }

  const unfriend = async (friendshipId: string) => {
    await removeFriendshipApi(friendshipId)
    setFriends((prev) => prev.filter((f) => f.friendship_id !== friendshipId))
  }

  const searchContacts = async (phone: string): Promise<SearchedContact[]> => {
    return searchUsersApi(phone)
  }

  useEffect(() => {
    fetchFriends()
    fetchRequests()
  }, [fetchFriends, fetchRequests])

  // MỚI — có người gửi lời mời kết bạn cho mình trong lúc app đang mở
  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    const handleRequest = (data: FriendRequest) => {
      setRequests((prev) => (prev.some((r) => r.id === data.id) ? prev : [data, ...prev]))
    }

    socket.on('friendship:request', handleRequest)
    return () => { socket.off('friendship:request', handleRequest) }
  }, [])

  // MỚI — lời mời của mình vừa được chấp nhận (mình là requester), hoặc
  // đồng bộ đa tab khi chính mình (receiver) vừa accept ở tab khác
  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    const handleAccepted = (data: { friendship_id: string; friend: Friend }) => {
      setFriends((prev) =>
        prev.some((f) => f.friendship_id === data.friendship_id) ? prev : [data.friend, ...prev]
      )
      setRequests((prev) => prev.filter((r) => r.id !== data.friendship_id))
      seedOnlineStatus(data.friend.id, !!data.friend.is_online)
    }

    socket.on('friendship:accepted', handleAccepted)
    return () => { socket.off('friendship:accepted', handleAccepted) }
  }, [seedOnlineStatus])

  // MỚI — lời mời của mình vừa bị từ chối — dọn khỏi "requests" nếu đồng
  // bộ đa tab phía receiver; phía requester không có gì để dọn ở state
  // của hook này (họ chưa từng có nó trong "requests")
  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    const handleRejected = (data: { friendship_id: string }) => {
      setRequests((prev) => prev.filter((r) => r.id !== data.friendship_id))
    }

    socket.on('friendship:rejected', handleRejected)
    return () => { socket.off('friendship:rejected', handleRejected) }
  }, [])

  // MỚI — bên kia vừa huỷ kết bạn (hoặc đồng bộ đa tab khi chính mình huỷ
  // ở tab khác) — tự xoá khỏi "friends" ngay, không cần F5
  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    const handleRemoved = (data: { friendship_id: string }) => {
      setFriends((prev) => prev.filter((f) => f.friendship_id !== data.friendship_id))
    }

    socket.on('friendship:removed', handleRemoved)
    return () => { socket.off('friendship:removed', handleRemoved) }
  }, [])

  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    const handleCancelled = (data: { friendship_id: string }) => {
      setRequests((prev) => prev.filter((r) => r.id !== data.friendship_id))
    }

    socket.on('friendship:cancelled', handleCancelled)
    return () => { socket.off('friendship:cancelled', handleCancelled) }
  }, [])

  return {
    friends,
    requests,
    loading,
    error,
    sendRequest,
    acceptRequest,
    rejectRequest,
    unfriend,
    searchContacts,
    refetchFriends: fetchFriends,
    refetchRequests: fetchRequests,
  }
}