// src/hooks/useContactSharedInfo.ts
import { useState, useEffect } from 'react'
import { getMutualGroupsApi, getPrivateConversationIdApi } from '../api/conversation.api'
import { getMediaListApi } from '../api/media.api'
import type { MutualGroup } from '../types/mutual.types'
import type { MediaItem } from '../types/media.types'

export function useContactSharedInfo(otherUserId: string | undefined) {
  const [mutualGroups, setMutualGroups] = useState<MutualGroup[]>([])
  const [allFiles, setAllFiles] = useState<MediaItem[]>([])
  const [photosVideos, setPhotosVideos] = useState<MediaItem[]>([])
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!otherUserId) {
      setMutualGroups([])
      setAllFiles([])
      setPhotosVideos([])
      return
    }

    let cancelled = false
    setLoading(true)

    Promise.all([
      getMutualGroupsApi(otherUserId),
      getPrivateConversationIdApi(otherUserId),
    ])
      .then(async ([groups, conversationId]) => {
        if (cancelled) return
        setMutualGroups(groups) // giữ nguyên toàn bộ, không cắt ở hook nữa

        if (!conversationId) {
          setAllFiles([])
          setPhotosVideos([])
          return
        }

        const all = await getMediaListApi(conversationId)
        if (cancelled) return

        setAllFiles(all)
        setPhotosVideos(all.filter((m) => m.category === 'image' || m.category === 'video'))
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })

    return () => { cancelled = true }
  }, [otherUserId])

  return { mutualGroups, allFiles, photosVideos, loading }
}