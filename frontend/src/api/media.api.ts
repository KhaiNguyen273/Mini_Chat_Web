// src/api/media.api.ts
import axiosClient from './axiosClient'
import type { MediaItem, MediaSummary, MediaCategory } from '../types/media.types'

export const getMediaSummaryApi = (conversationId: string) =>
  axiosClient
    .get<{ data: MediaSummary }>(`/conversations/${conversationId}/media/summary`)
    .then((res) => res.data.data)

export const getMediaListApi = (conversationId: string, category?: MediaCategory, cursor?: string) =>
  axiosClient
    .get<{ data: MediaItem[] }>(`/conversations/${conversationId}/media`, {
      params: { category, cursor, limit: 30 },
    })
    .then((res) => res.data.data)