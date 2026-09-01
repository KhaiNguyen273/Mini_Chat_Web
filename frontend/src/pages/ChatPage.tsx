import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate, useSearchParams } from 'react-router-dom'
import MainLayout from '../templates/MainLayout'
import Sidebar from '../components/sidebar/conversation/ConversationSidebar'
import InfoPanel from '../components/info/InfoPanel'
import ChatWindow from '../components/window/chat/ChatWindow'
import { useConversationDetail } from '../hooks/useConversationDetail'
import { useMessage } from '../hooks/useMessage'
import { useBlock } from '../hooks/useBlock'
import { useConfirm } from '../hooks/useConfirm'
import { useToast } from '../hooks/useToast'
import { useNotification } from '../hooks/useNotification'
import { useAuth } from '../hooks/useAuth'
import { getMessageByIdApi } from '../api/message.api'
import { useConversationContext } from '../contexts/ConversationContext'
import { useMarkAsRead } from '../hooks/useMarkAsRead'

function ChatPage() {
  const { conversationId } = useParams()
  const [showInfo, setShowInfo] = useState(true)

  return (
    <MainLayout>
      <ChatPageInner
        conversationId={conversationId}
        showInfo={showInfo}
        onToggleInfo={() => setShowInfo((prev) => !prev)}
      />
    </MainLayout>
  )
}

function ChatPageInner({
  conversationId,
  showInfo,
  onToggleInfo,
}: {
  conversationId?: string
  showInfo: boolean
  onToggleInfo: () => void
}) {
  const navigate = useNavigate()
  const { conversations, loading } = useConversationContext()

  useEffect(() => {
    if (conversationId || loading) return
    if (conversations.length > 0) {
      navigate(`/chat/${conversations[0].id}`, { replace: true })
    }
  }, [conversationId, loading, conversations, navigate])

  return (
    <>
      <Sidebar selectedId={conversationId || null} onSelect={(id) => navigate(`/chat/${id}`)} />
      {conversationId ? (
        <ChatPageContent
          key={conversationId}
          conversationId={conversationId}
          showInfo={showInfo}
          onToggleInfo={onToggleInfo}
        />
      ) : (
        <div className="flex flex-1 items-center justify-center text-sm text-[#565f71]">
          {loading ? 'Đang tải...' : 'Chưa có đoạn chat nào'}
        </div>
      )}
    </>
  )
}

function ChatPageContent({
  conversationId,
  showInfo,
  onToggleInfo,
}: {
  conversationId: string
  showInfo: boolean
  onToggleInfo: () => void
}) {
  const { user } = useAuth()
  const { markAsRead } = useConversationContext()
  const detail = useConversationDetail(conversationId)
  const messageState = useMessage(conversationId)
  const [highlightMessageId, setHighlightMessageId] = useState<string | null>(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const { markConversationNotificationsRead } = useNotification()
  const highlightParam = searchParams.get('highlight')
  const { markOnOpen, markOnActiveAction } = useMarkAsRead(conversationId)

  const { blockedList, blockUser, unblockUser } = useBlock()
  const confirm = useConfirm()
  const { showToast } = useToast()

  const otherUserId = detail.conversation?.other_user_id
  const iBlockedThem = !!otherUserId && blockedList.some((b) => b.user_id === otherUserId)
  const theyBlockedMe = detail.isBlockedByOther

  useEffect(() => {
    markOnOpen()
  }, [markOnOpen])

  // MỚI — đang mở sẵn conversation này mà có tin nhắn mới tới (không phải
  // do chính mình gửi) -> đánh dấu đã đọc NGAY LẬP TỨC, không cần chờ thao
  // tác gõ phím nữa. Bỏ qua lần đầu (đã được markOnOpen xử lý lúc mount).
  const lastMessageIdRef = useRef<string | null>(null)
  useEffect(() => {
    const messages = messageState.messages
    if (messages.length === 0) return
    const last = messages[messages.length - 1]

    if (lastMessageIdRef.current === last.id) return
    const isFirstRun = lastMessageIdRef.current === null
    lastMessageIdRef.current = last.id

    if (isFirstRun) return // lần load đầu tiên — đã có markOnOpen lo, không lặp lại
    if (String(last.sender_id) === String(user?.id)) return // tin của chính mình — không cần đánh dấu

    markAsRead(conversationId).catch(() => {})
  }, [messageState.messages, user, markAsRead, conversationId])

  const handleToggleBlock = async () => {
    if (!otherUserId) return

    if (theyBlockedMe && !iBlockedThem) {
      showToast('Người này đã chặn bạn, không thể thực hiện thao tác này', 'error')
      return
    }

    const ok = iBlockedThem
      ? await confirm({
          title: 'Bỏ chặn người dùng',
          message: `Bỏ chặn ${detail.displayName}? Người này sẽ có thể nhắn tin cho bạn trở lại.`,
          confirmText: 'Bỏ chặn',
        })
      : await confirm({
          title: 'Chặn người dùng',
          message: `Chặn ${detail.displayName}? Bạn sẽ không nhận được tin nhắn từ người này nữa.`,
          confirmText: 'Chặn',
          danger: true,
        })

    if (!ok) return

    try {
      if (iBlockedThem) {
        await unblockUser(otherUserId)
        showToast('Đã bỏ chặn', 'info')
      } else {
        await blockUser(otherUserId)
        showToast('Đã chặn người dùng', 'info')
      }
    } catch {
      showToast('Có lỗi xảy ra, vui lòng thử lại', 'error')
    }
  }

  useEffect(() => {
    markConversationNotificationsRead(conversationId)
  }, [conversationId])

  useEffect(() => {
    if (!highlightParam) return
    if (messageState.loading) return

    getMessageByIdApi(highlightParam)
      .then(async (msg) => {
        await messageState.jumpToMessage(highlightParam, msg.created_at)
        setHighlightMessageId(highlightParam)
        setTimeout(() => setHighlightMessageId(null), 2000)
      })
      .catch(() => {})
      .finally(() => {
        searchParams.delete('highlight')
        setSearchParams(searchParams, { replace: true })
      })
  }, [highlightParam, messageState.loading])

  const jumpTo = async (messageId: string, createdAt: string) => {
    await messageState.jumpToMessage(messageId, createdAt)
    setHighlightMessageId(messageId)
    setTimeout(() => setHighlightMessageId(null), 2000)
  }

  return (
    <>
      <ChatWindow
        conversationId={conversationId}
        detail={detail}
        messageState={messageState}
        highlightMessageId={highlightMessageId}
        onToggleInfo={onToggleInfo}
        iBlockedThem={iBlockedThem}
        blockedByOther={theyBlockedMe}
        onUnblock={handleToggleBlock}
        onActiveTyping={markOnActiveAction}
      />
      {showInfo && (
        <InfoPanel
          conversationId={conversationId}
          detail={detail}
          isBlocked={iBlockedThem}
          onToggleBlock={handleToggleBlock}
          onJumpToMessage={jumpTo}
        />
      )}
    </>
  )
}

export default ChatPage