import { useEffect, useRef, useCallback, useMemo } from 'react'
import MessageItem from './MessageItem'
import { useAuth } from '../../../hooks/useAuth'
import { usePinnedMessages } from '../../../hooks/usePinnedMessages'
import { useToast } from '../../../hooks/useToast'
import type { useMessage } from '../../../hooks/useMessage'
import type { ConversationMember } from '../../../types/conversation.types'
import GroupAvatar from '../../ui/GroupAvatar'

interface ReaderInfo {
  id: string
  name: string
  avatar_url?: string
  readAt: string
}

interface MessageListProps {
  conversationId: string
  displayName: string
  displayAvatar?: string
  getAvatarBySender: (senderId: string) => string | undefined
  messageState: ReturnType<typeof useMessage>
  highlightMessageId?: string | null
  isOtherTyping?: boolean
  members: ConversationMember[]
  currentUserId?: string
  conversationType?: string // mới
  groupAvatarUrl?: string | null // mới
}

function MessageList({ conversationId, displayName, displayAvatar, getAvatarBySender, messageState, highlightMessageId, isOtherTyping, members, currentUserId, conversationType, groupAvatarUrl }: MessageListProps) {
  const { user } = useAuth()
  const { messages, loading, loadingMore, hasMore, loadMore, refetch, deleteMessage } = messageState
  const { pins, fetchPins, pin, unpin } = usePinnedMessages(conversationId)
  const { showToast } = useToast()

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const topSentinelRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const isFirstLoad = useRef(true)
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({})

  const prevScrollHeightRef = useRef(0)

  useEffect(() => { fetchPins() }, [fetchPins])

  useEffect(() => {
    if (isFirstLoad.current && messages.length > 0) {
      bottomRef.current?.scrollIntoView()
      isFirstLoad.current = false
    }
  }, [messages])

  useEffect(() => {
    if (highlightMessageId && messageRefs.current[highlightMessageId]) {
      messageRefs.current[highlightMessageId]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [highlightMessageId, messages])

  const handleLoadMore = useCallback(() => {
    if (scrollContainerRef.current) {
      prevScrollHeightRef.current = scrollContainerRef.current.scrollHeight
    }
    loadMore()
  }, [loadMore])

  useEffect(() => {
    const sentinel = topSentinelRef.current
    const container = scrollContainerRef.current
    if (!sentinel || !container) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting && hasMore && !loadingMore && !loading) {
          handleLoadMore()
        }
      },
      { root: container, threshold: 0.1 }
    )

    observer.observe(sentinel)
    return () => observer.disconnect()
  }, [hasMore, loadingMore, loading, handleLoadMore])

  useEffect(() => {
    if (!loadingMore && scrollContainerRef.current && prevScrollHeightRef.current > 0) {
      const newScrollHeight = scrollContainerRef.current.scrollHeight
      const diff = newScrollHeight - prevScrollHeightRef.current
      if (diff > 0) {
        scrollContainerRef.current.scrollTop += diff
      }
      prevScrollHeightRef.current = 0
    }
  }, [messages, loadingMore])

  const pinnedIds = new Set(pins.map((p) => p.message.id))

  const handleTogglePin = async (messageId: string, isPinned: boolean) => {
    try {
      if (isPinned) {
        await unpin(messageId)
      } else {
        await pin(messageId)
      }
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Không thể ghim, vui lòng thử lại', 'error')
    }
  }

  const handleDelete = async (messageId: string) => {
    try {
      await deleteMessage(messageId)
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Không thể thu hồi tin nhắn', 'error')
    }
  }

  // với MỖI thành viên KHÁC (không phải mình), tìm tin nhắn cuối cùng (mới
  // nhất, bất kể ai gửi) mà họ đã đọc tới -> map ngược: messageId -> danh
  // sách reader cần hiện dưới tin đó
  const readReceiptsByMessageId = useMemo(() => {
    const result: Record<string, ReaderInfo[]> = {}

    // guard — chưa xác định được currentUserId (VD user context chưa load
    // xong ở lần render đầu) thì không tính gì cả, tránh lọt chính mình vào
    // danh sách reader do String(undefined) không khớp bất kỳ id thật nào
    if (!currentUserId) return result

    const otherMembers = members.filter((m) => String(m.id) !== String(currentUserId))

    for (const member of otherMembers) {
      // phòng vệ thêm lần nữa ngay trong vòng lặp — không tin tưởng hoàn
      // toàn vào filter ở trên nếu có sai lệch định dạng id bất ngờ
      if (String(member.id) === String(currentUserId)) continue
      if (!member.last_read_at) continue

      const readTime = new Date(member.last_read_at).getTime()

      let lastReadMessageId: string | null = null
      for (let i = messages.length - 1; i >= 0; i--) {
        const msg = messages[i]
        if (new Date(msg.created_at).getTime() <= readTime) {
          lastReadMessageId = msg.id
          break
        }
      }

      if (lastReadMessageId) {
        if (!result[lastReadMessageId]) result[lastReadMessageId] = []
        result[lastReadMessageId].push({
          id: member.id,
          name: member.name,
          avatar_url: member.avatar_url,
          readAt: member.last_read_at,
        })
      }
    }

    return result
  }, [members, messages, currentUserId])

  if (loading) return <div className="flex-1 flex items-center justify-center text-sm text-[#565f71]">Đang tải...</div>

  return (
    <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">

      <div ref={topSentinelRef} className="h-px shrink-0" />

      {loadingMore && (
        <p className="text-xs text-center text-[#565f71]">Đang tải tin nhắn cũ hơn...</p>
      )}

      {highlightMessageId && (
        <button
          onClick={() => refetch()}
          className="text-xs text-[#2563eb] self-center hover:underline"
        >
          Quay về tin nhắn mới nhất
        </button>
      )}

      <div className="flex flex-col items-center gap-2 my-4">
        {conversationType === 'group' ? (
          <GroupAvatar avatarUrl={groupAvatarUrl} memberAvatars={members.map((m) => m.avatar_url)} size={80} />
        ) : (
          <img src={displayAvatar} alt="avatar" className="w-20 h-20 rounded-full object-cover"/>
        )}
        <p className="text-base font-semibold text-[#1a1c1e]">{displayName}</p>
      </div>

      {messages.map((msg) => (
        <div
          key={msg.id}
          ref={(el) => { messageRefs.current[msg.id] = el }}
        >
          <MessageItem
            id={msg.id}
            content={msg.content}
            isMine={String(msg.sender_id) === String(user?.id)}
            time={new Date(msg.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
            avatar={getAvatarBySender(msg.sender_id)}
            attachments={msg.attachments}
            isPinned={pinnedIds.has(msg.id)}
            onTogglePin={handleTogglePin}
            onDelete={handleDelete}
            isHighlighted={highlightMessageId === msg.id}
            type={msg.type}
            isDeleted={(msg as any).is_deleted}
            readers={readReceiptsByMessageId[msg.id]}
          />
        </div>
      ))}

      {isOtherTyping && (
        <div className="flex items-center gap-2 px-1">
          <div className="px-4 py-2.5 rounded-2xl bg-[#ecf0f3] text-xs text-[#70787d]">...</div>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}

export default MessageList