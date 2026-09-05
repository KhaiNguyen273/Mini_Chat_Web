import { useState, useCallback, useRef, useEffect } from 'react'
import { getMediaSummaryApi, getMediaListApi } from '../api/media.api'
import type { MediaItem, MediaSummary, MediaCategory } from '../types/media.types'
import { getSocket } from '../socket/socketClient'

export function useConversationMedia(conversationId: string) {
  const [summary, setSummary] = useState<MediaSummary>({ image: 0, video: 0, file: 0 })
  const [items, setItems] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(false)
  const lastCategoryRef = useRef<MediaCategory | undefined>(undefined)

  const fetchSummary = useCallback(async () => {
    setSummary(await getMediaSummaryApi(conversationId))
  }, [conversationId])

  const fetchList = useCallback(async (category?: MediaCategory) => {
    lastCategoryRef.current = category
    setLoading(true)
    try {
      setItems(await getMediaListApi(conversationId, category))
    } finally {
      setLoading(false)
    }
  }, [conversationId])

  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    const handleDeleted = ({ conversationId: cid }: { conversationId: number }) => {
      if (String(cid) !== conversationId) return
      fetchSummary()
      fetchList(lastCategoryRef.current)
    }

    socket.on('message:deleted', handleDeleted)
    return () => { socket.off('message:deleted', handleDeleted) }
  }, [conversationId, fetchSummary, fetchList])

  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    const handleDeleted = ({ conversationId: cid }: { conversationId: number }) => {
      if (String(cid) !== conversationId) return
      fetchSummary()
      fetchList(lastCategoryRef.current)
    }

    const handleNewMessage = (msg: any) => {
      if (String(msg.conversation_id) !== conversationId) return
      if (!msg.attachments || msg.attachments.length === 0) return
      fetchSummary()
      fetchList(lastCategoryRef.current)
    }

    socket.on('message:deleted', handleDeleted)
    socket.on('message:new', handleNewMessage)
    return () => {
      socket.off('message:deleted', handleDeleted)
      socket.off('message:new', handleNewMessage)
    }
  }, [conversationId, fetchSummary, fetchList])

  return { summary, items, loading, fetchSummary, fetchList }
}