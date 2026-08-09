import axiosClient from './axiosClient'
import type {
  Friend,
  FriendRequest,
  CreateFriendshipResponse,
  SearchedContact,
} from '../types/friendship.types'

export const sendFriendRequestApi = (receiverId: string) =>
  axiosClient
    .post<{ data: CreateFriendshipResponse }>('/friendships', { receiverId })
    .then((res) => res.data.data)

export const acceptFriendRequestApi = (friendshipId: string) =>
  axiosClient
    .put<{ data: CreateFriendshipResponse }>(`/friendships/${friendshipId}/accept`)
    .then((res) => res.data.data)

export const rejectFriendRequestApi = (friendshipId: string) =>
  axiosClient
    .put<{ data: CreateFriendshipResponse }>(`/friendships/${friendshipId}/reject`)
    .then((res) => res.data.data)

export const blockFriendApi = (friendshipId: string) =>
  axiosClient
    .put<{ data: CreateFriendshipResponse }>(`/friendships/${friendshipId}/block`)
    .then((res) => res.data.data)

export const removeFriendshipApi = (friendshipId: string) =>
  axiosClient.delete(`/friendships/${friendshipId}`)

export const getFriendsApi = () =>
  axiosClient.get<{ data: Friend[] }>('/friendships').then((res) => res.data.data)

export const getFriendRequestsApi = () =>
  axiosClient
    .get<{ data: FriendRequest[] }>('/friendships/requests')
    .then((res) => res.data.data)

// trả thẳng SearchedContact[] đã có relation sẵn, không cần map thêm
export const searchUsersApi = (phone: string) =>
  axiosClient
    .get<{ data: SearchedContact[] }>('/users/search', { params: { phone } })
    .then((res) => res.data.data)