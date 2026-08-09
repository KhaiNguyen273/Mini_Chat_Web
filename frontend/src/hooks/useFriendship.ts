import { useState, useEffect, useCallback } from 'react'
import {
  sendFriendRequestApi,
  acceptFriendRequestApi,
  rejectFriendRequestApi,
  blockFriendApi,
  removeFriendshipApi,
  getFriendsApi,
  getFriendRequestsApi,
  searchUsersApi,
} from '../api/friendship.api'
import type { Friend, FriendRequest, SearchedContact } from '../types/friendship.types'

export function useFriendship() {
  const [friends, setFriends] = useState<Friend[]>([])
  const [requests, setRequests] = useState<FriendRequest[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const fetchFriends = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      setFriends(await getFriendsApi())
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không tải được danh sách bạn bè')
    } finally {
      setLoading(false)
    }
  }, [])

  const fetchRequests = useCallback(async () => {
    try {
      setRequests(await getFriendRequestsApi())
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không tải được lời mời kết bạn')
    }
  }, [])

  const sendRequest = async (receiverId: string) => {
  try {
    return await sendFriendRequestApi(receiverId) // { id, status: 'pending' }
  } catch (err: any) {
    setError(err.response?.data?.message || 'Gửi lời mời thất bại')
    throw err
  }
}

  const acceptRequest = async (friendshipId: string) => {
    const result = await acceptFriendRequestApi(friendshipId) // { id, status: 'accepted' }
    setRequests((prev) => prev.filter((r) => r.id !== friendshipId))
    await fetchFriends()
    return result
  }

  const rejectRequest = async (friendshipId: string) => {
    const result = await rejectFriendRequestApi(friendshipId)
    setRequests((prev) => prev.filter((r) => r.id !== friendshipId))
    return result
  }

  const blockUser = async (friendshipId: string) => {
    await blockFriendApi(friendshipId)
    setFriends((prev) => prev.filter((f) => f.friendship_id !== friendshipId))
    setRequests((prev) => prev.filter((r) => r.id !== friendshipId))
  }

  const unfriend = async (friendshipId: string) => {
    await removeFriendshipApi(friendshipId)
    setFriends((prev) => prev.filter((f) => f.friendship_id !== friendshipId))
  }

  // giờ chỉ còn gọi thẳng API, không tự suy luận relation nữa
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
    blockUser,
    unfriend,
    searchContacts,
    refetchFriends: fetchFriends,
    refetchRequests: fetchRequests,
  }
}