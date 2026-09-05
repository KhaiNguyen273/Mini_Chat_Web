import { useState, useEffect } from 'react'
import { getMutualGroupsApi, getPrivateConversationIdApi } from '../api/conversation.api'
import { getMediaListApi } from '../api/media.api'
import type { MutualGroup } from '../types/mutual.types'
import type { MediaItem } from '../types/media.types'
import { getSocket } from '../socket/socketClient'

export function useContactSharedInfo(otherUserId: string | undefined) {
  const [mutualGroups, setMutualGroups] = useState<MutualGroup[]>([])
  const [allFiles, setAllFiles] = useState<MediaItem[]>([])
  const [photosVideos, setPhotosVideos] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(false)
  const [privateConversationId, setPrivateConversationId] = useState<string | null>(null)

  useEffect(() => {
    if (!otherUserId) {
      setMutualGroups([]); setAllFiles([]); setPhotosVideos([]); setPrivateConversationId(null)
      return
    }
    let cancelled = false
    setLoading(true)
    Promise.all([getMutualGroupsApi(otherUserId), getPrivateConversationIdApi(otherUserId)])
      .then(async ([groups, conversationId]) => {
        if (cancelled) return
        setMutualGroups(groups)
        setPrivateConversationId(conversationId)
        if (!conversationId) { setAllFiles([]); setPhotosVideos([]); return }
        const all = await getMediaListApi(conversationId)
        if (cancelled) return
        setAllFiles(all)
        setPhotosVideos(all.filter((m) => m.category === 'image' || m.category === 'video'))
      })
      .finally(() => { if (!cancelled) setLoading(false) })
    return () => { cancelled = true }
  }, [otherUserId])

  useEffect(() => {
    const socket = getSocket()
    if (!socket || !privateConversationId) return

    const refetch = () =>
      getMediaListApi(privateConversationId).then((all) => {
        setAllFiles(all)
        setPhotosVideos(all.filter((m) => m.category === 'image' || m.category === 'video'))
      })

    const handleDeleted = ({ conversationId: cid }: { conversationId: number }) => {
      if (String(cid) !== privateConversationId) return
      refetch()
    }
    const handleNewMessage = (msg: any) => {
      if (String(msg.conversation_id) !== privateConversationId) return
      if (!msg.attachments || msg.attachments.length === 0) return
      refetch()
    }

    socket.on('message:deleted', handleDeleted)
    socket.on('message:new', handleNewMessage)
    return () => {
      socket.off('message:deleted', handleDeleted)
      socket.off('message:new', handleNewMessage)
    }
  }, [privateConversationId])

  return { mutualGroups, allFiles, photosVideos, loading }
}