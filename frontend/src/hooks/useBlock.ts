import { useState, useEffect, useCallback } from 'react'
import { blockUserApi, unblockUserApi, getBlockedListApi } from '../api/block.api'
import type { BlockedUser } from '../types/block.types'

export function useBlock() {
  const [blockedList, setBlockedList] = useState<BlockedUser[]>([])
  const [loading, setLoading] = useState(false)

  const fetchBlockedList = useCallback(async () => {
    setLoading(true)
    try {
      setBlockedList(await getBlockedListApi())
    } finally {
      setLoading(false)
    }
  }, [])

  const blockUser = async (targetId: string) => {
    await blockUserApi(targetId)
    await fetchBlockedList()
  }

  const unblockUser = async (targetId: string) => {
    await unblockUserApi(targetId)
    setBlockedList((prev) => prev.filter((b) => b.user_id !== targetId))
  }

  useEffect(() => {
    fetchBlockedList()
  }, [fetchBlockedList])

  return { blockedList, loading, blockUser, unblockUser, refetch: fetchBlockedList }
}