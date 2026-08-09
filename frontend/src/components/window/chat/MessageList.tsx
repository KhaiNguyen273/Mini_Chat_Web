// MessageList.tsx — bỏ gọi useMessage riêng, nhận qua props
import { useEffect, useRef } from 'react'
import MessageItem from './MessageItem'
import { useAuth } from '../../../hooks/useAuth'
import type { useMessage } from '../../../hooks/useMessage'

interface MessageListProps {
  displayName: string
  displayAvatar?: string
  getAvatarBySender: (senderId: string) => string | undefined
  messageState: ReturnType<typeof useMessage>
}

function MessageList({ displayName, displayAvatar, getAvatarBySender, messageState }: MessageListProps) {
  const { user } = useAuth()
  const { messages, loading, loadingMore, hasMore, loadMore } = messageState
  const bottomRef = useRef<HTMLDivElement>(null)
  const isFirstLoad = useRef(true)

  useEffect(() => {
    if (isFirstLoad.current && messages.length > 0) {
      bottomRef.current?.scrollIntoView()
      isFirstLoad.current = false
    }
  }, [messages])

  if (loading) return <div className="flex-1 flex items-center justify-center text-sm text-[#565f71]">Đang tải...</div>

  return (
    <div className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-4">
      {hasMore && (
        <button onClick={loadMore} disabled={loadingMore} className="text-xs text-[#2563eb] self-center hover:underline disabled:opacity-50">
          {loadingMore ? 'Đang tải...' : 'Xem tin nhắn cũ hơn'}
        </button>
      )}

      <div className="flex flex-col items-center gap-2 my-4">
        <img src={displayAvatar} alt="avatar" className="w-20 h-20 rounded-full object-cover"/>
        <p className="text-base font-semibold text-[#1a1c1e]">{displayName}</p>
      </div>

      {messages.map((msg) => (
        <MessageItem
          key={msg.id}
          content={msg.content}
          isMine={String(msg.sender_id) === String(user?.id)}
          time={new Date(msg.created_at).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
          avatar={getAvatarBySender(msg.sender_id)}
          attachments={msg.attachments}   // ← thêm dòng này
        />
      ))}

      <div ref={bottomRef} />
    </div>
  )
}

export default MessageList