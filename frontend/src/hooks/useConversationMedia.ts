// src/hooks/useConversationMedia.ts
import { useState, useCallback } from 'react'
import { getMediaSummaryApi, getMediaListApi } from '../api/media.api'
import type { MediaItem, MediaSummary, MediaCategory } from '../types/media.types'

export function useConversationMedia(conversationId: string) {
  const [summary, setSummary] = useState<MediaSummary>({ image: 0, video: 0, file: 0 })
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(false)

  const fetchSummary = useCallback(async () => {
    setSummary(await getMediaSummaryApi(conversationId))
  }, [conversationId])

  const fetchList = useCallback(async (category?: MediaCategory) => {
    setLoading(true)
    try {
      setItems(await getMediaListApi(conversationId, category))
    } finally {
      setLoading(false)
    }
  }, [conversationId])

  return { summary, items, loading, fetchSummary, fetchList }
}