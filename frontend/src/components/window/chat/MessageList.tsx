import { useEffect, useRef, useMemo, useState } from 'react'
import MessageItem from './MessageItem'
import { useAuth } from '../../../hooks/useAuth'
import { usePinnedMessages } from '../../../hooks/usePinnedMessages'
import { useToast } from '../../../hooks/useToast'
import type { useMessage } from '../../../hooks/useMessage'
import type { ConversationMember } from '../../../types/conversation.types'
import GroupAvatar from '../../ui/GroupAvatar'
import { isAfterBySecond } from '../../../utils/timeCompare'

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
  conversationType?: string
  groupAvatarUrl?: string | null
}

function MessageList({ conversationId, displayName, displayAvatar, getAvatarBySender, messageState, highlightMessageId, isOtherTyping, members, currentUserId, conversationType, groupAvatarUrl }: MessageListProps) {
  const { user } = useAuth()
  const { messages, loading, loadingMore, hasMore, loadMore, refetch, deleteMessage } = messageState
  const { pins, fetchPins, pin, unpin } = usePinnedMessages(conversationId)
  const { showToast } = useToast()

  const scrollContainerRef = useRef<HTMLDivElement>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const isFirstLoad = useRef(true)
  const messageRefs = useRef<Record<string, HTMLDivElement | null>>({})
  const prevScrollHeightRef = useRef(0)

  const [isAtBottom, setIsAtBottom] = useState(true)
  const [hasNewMessage, setHasNewMessage] = useState(false)
  const lastMessageIdRef = useRef<string | null>(null)

  useEffect(() => { fetchPins() }, [fetchPins])

  // gắn lại listener mỗi khi loading/hasMore/loadMore đổi — closure luôn đọc
  // đúng giá trị mới nhất, không dùng ref trung gian dễ lệch nhịp. Đây là
  // CƠ CHẾ DUY NHẤT xử lý cả detect-đáy lẫn load-thêm — không còn
  // IntersectionObserver song song nữa để tránh 2 nguồn cùng gọi loadMore
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container) return

    const handleScroll = () => {
      const distanceFromBottom = container.scrollHeight - container.scrollTop - container.clientHeight
      const atBottom = distanceFromBottom < 100
      setIsAtBottom(atBottom)
      if (atBottom) setHasNewMessage(false)

      if (container.scrollTop < 100 && hasMore && !loading && !loadingMore) {
        prevScrollHeightRef.current = container.scrollHeight
        loadMore()
      }
    }

    container.addEventListener('scroll', handleScroll, { passive: true })
    return () => container.removeEventListener('scroll', handleScroll)
  }, [hasMore, loading, loadingMore, loadMore])

  // lần đầu -> nhảy thẳng xuống đáy. Các lần sau có tin mới ở cuối:
  //   - đang ở đáy -> tự cuộn mượt xuống
  //   - đang đọc lịch sử -> KHÔNG cuộn, chỉ đánh dấu có tin mới
  useEffect(() => {
    if (messages.length === 0) return
    const last = messages[messages.length - 1]

    if (isFirstLoad.current) {
      bottomRef.current?.scrollIntoView()
      isFirstLoad.current = false
      lastMessageIdRef.current = last.id
      return
    }

    if (lastMessageIdRef.current === last.id) return
    lastMessageIdRef.current = last.id

    const isMine = String(last.sender_id) === String(user?.id)

    // đang ở đáy -> luôn cuộn theo tin mới
    // KHÔNG ở đáy -> chỉ cuộn nếu chính mình vừa gửi (A chủ động gửi, luôn
    // muốn thấy tin mình vừa gửi ngay); tin từ người khác thì tuyệt đối
    // không tự cuộn, chỉ hiện badge "tin nhắn mới"
    if (isAtBottom || isMine) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
      setHasNewMessage(false)
    } else {
      setHasNewMessage(true)
    }
  }, [messages, isAtBottom, user])

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    setHasNewMessage(false)
  }

  // giữ nguyên vị trí scroll sau khi prepend tin cũ (chỉ 1 effect duy nhất)
  useEffect(() => {
    if (!loadingMore && scrollContainerRef.current && prevScrollHeightRef.current > 0) {
      const newScrollHeight = scrollContainerRef.current.scrollHeight
      const diff = newScrollHeight - prevScrollHeightRef.current
      if (diff > 0) scrollContainerRef.current.scrollTop += diff
      prevScrollHeightRef.current = 0
    }
  }, [messages, loadingMore])

  // MỚI — nếu tin nhắn hiện có chưa đủ tràn khung (không thể cuộn), scroll
  // event sẽ không bao giờ phát sinh dù logic loadMore đúng. Tự nạp thêm cho
  // tới khi tràn khung hoặc hết dữ liệu cũ
  useEffect(() => {
    const container = scrollContainerRef.current
    if (!container || loading || loadingMore) return
    if (hasMore && container.scrollHeight <= container.clientHeight) {
      prevScrollHeightRef.current = container.scrollHeight
      loadMore()
    }
  }, [messages, loading, loadingMore, hasMore, loadMore])

  useEffect(() => {
    if (highlightMessageId && messageRefs.current[highlightMessageId]) {
      messageRefs.current[highlightMessageId]?.scrollIntoView({ behavior: 'smooth', block: 'center' })
    }
  }, [highlightMessageId, messages])

  const pinnedIds = new Set(pins.map((p) => p.message.id))

  const handleTogglePin = async (messageId: string, isPinned: boolean) => {
    try {
      if (isPinned) await unpin(messageId)
      else await pin(messageId)
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

  const readReceiptsByMessageId = useMemo(() => {
    const result: Record<string, ReaderInfo[]> = {}
    if (!currentUserId) return result
    const otherMembers = members.filter((m) => String(m.id) !== String(currentUserId))
    for (const member of otherMembers) {
      if (!member.last_read_at) continue
      let lastReadMessageId: string | null = null
      for (let i = messages.length - 1; i >= 0; i--) {
        const msg = messages[i]
        // KHÔNG isAfterBySecond ở đây — cần điều kiện <=, đảo ngược lại:
        // tìm tin cuối cùng mà msg.created_at KHÔNG sau last_read_at (theo giây)
        if (!isAfterBySecond(msg.created_at, member.last_read_at)) {
          lastReadMessageId = msg.id
          break
        }
      }
      if (lastReadMessageId) {
        if (!result[lastReadMessageId]) result[lastReadMessageId] = []
        result[lastReadMessageId].push({
          id: member.id, name: member.name, avatar_url: member.avatar_url, readAt: member.last_read_at,
        })
      }
    }
    return result
  }, [members, messages, currentUserId])

  if (loading) return <div className="flex-1 flex items-center justify-center text-sm text-[#565f71]">Đang tải...</div>

  return (
    <div className="relative flex-1 flex flex-col min-h-0">
      <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">
        {loadingMore && (
          <p className="text-xs text-center text-[#565f71]">Đang tải tin nhắn cũ hơn...</p>
        )}

        {highlightMessageId && (
          <button onClick={() => refetch()} className="text-xs text-[#2563eb] self-center hover:underline">
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
          <div key={msg.id} ref={(el) => { messageRefs.current[msg.id] = el }}>
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
              currentUserId={user?.id} // MỚI
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

      {!isAtBottom && (
        <button
          onClick={scrollToBottom}
          className="absolute bottom-4 left-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-white shadow-lg border border-[#e6ebef] flex items-center justify-center hover:bg-[#f2f4f6] transition-colors z-10"
        >
          {hasNewMessage && (
            <span className="absolute -top-1 -right-1 w-3 h-3 rounded-full bg-[#2563eb] border-2 border-white" />
          )}
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2.5">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </button>
      )}
    </div>
  )
}

export default MessageList