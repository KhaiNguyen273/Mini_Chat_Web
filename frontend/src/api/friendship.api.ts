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

// blockFriendApi đã bị xoá — chặn giờ dùng block.api.ts (POST/DELETE /users/:id/block)

export const removeFriendshipApi = (friendshipId: string) =>
  axiosClient.delete(`/friendships/${friendshipId}`)

export const getFriendsApi = () =>
  axiosClient.get<{ data: Friend[] }>('/friendships').then((res) => res.data.data)

export const getFriendRequestsApi = () =>
  axiosClient
    .get<{ data: FriendRequest[] }>('/friendships/requests')
    .then((res) => res.data.data)

export const searchUsersApi = (phone: string) =>
  axiosClient
    .get<{ data: SearchedContact[] }>('/users/search', { params: { phone } })
    .then((res) => res.data.data)