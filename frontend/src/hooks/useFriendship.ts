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