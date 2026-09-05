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
import { useIsMobile } from '../hooks/useIsMobile'

function ChatPage() {
  const { conversationId } = useParams()

  return (
    <MainLayout>
      <ChatPageInner conversationId={conversationId} />
    </MainLayout>
  )
}

function ChatPageInner({ conversationId }: { conversationId?: string }) {
  const navigate = useNavigate()
  const { conversations, loading } = useConversationContext()
  const isMobile = useIsMobile()

  useEffect(() => {
    if (isMobile) return // mobile — không tự nhảy vào đoạn chat đầu tiên, phải để danh sách hiện ra trước
    if (conversationId || loading) return
    if (conversations.length > 0) {
      navigate(`/chat/${conversations[0].id}`, { replace: true })
    }
  }, [conversationId, loading, conversations, navigate, isMobile])

  return (
    <>
      <Sidebar
        selectedId={conversationId || null}
        onSelect={(id) => navigate(`/chat/${id}`)}
        className={conversationId ? 'hidden' : 'flex'}
      />
      <div className={`${conversationId ? 'flex' : 'hidden'} md:flex flex-1 min-w-0`}>
        {conversationId ? (
          <ChatPageContent
            key={conversationId}
            conversationId={conversationId}
            onBack={() => navigate('/chat')}
          />
        ) : (
          <div className="hidden md:flex flex-1 items-center justify-center text-sm text-[#565f71]">
            {loading ? 'Đang tải...' : 'Chưa có đoạn chat nào'}
          </div>
        )}
      </div>
    </>
  )
}

function ChatPageContent({
  conversationId, onBack,
}: {
  conversationId: string
  onBack: () => void
}) {
  const { user } = useAuth()
  const { markAsRead: markConversationAsRead } = useConversationContext()
  const detail = useConversationDetail(conversationId)
  const messageState = useMessage(conversationId)
  const [highlightMessageId, setHighlightMessageId] = useState<string | null>(null)
  const [searchParams, setSearchParams] = useSearchParams()
  const { notifications, markAsRead: markNotificationAsRead } = useNotification()
  const highlightParam = searchParams.get('highlight')
  const { markOnOpen, markOnActiveAction } = useMarkAsRead(conversationId)
  const processedHighlightRef = useRef<string | null>(null)
  const isMobile = useIsMobile()

  // MỚI — showInfo giờ khởi tạo NGAY TẠI ĐÂY. ChatPageContent remount hoàn
  // toàn mỗi khi conversationId đổi (nhờ key={conversationId} ở component
  // cha), nên state tự reset về đúng mặc định mỗi lần vào 1 conversation
  // khác — không còn "rò rỉ" trạng thái đã mở info từ conversation trước
  // sang conversation sau. Trước đây showInfo nằm ở ChatPage (không remount
  // theo conversationId) nên trên mobile, nếu từng bấm mở info ở
  // conversation A, chuyển sang conversation B sẽ lập tức bị đè bởi overlay
  // thông tin full-screen — đúng hiện tượng "tuỳ lúc" bị nhảy sang info.
  const [showInfo, setShowInfo] = useState(!isMobile)
  const onToggleInfo = () => setShowInfo((prev) => !prev)

  const { blockedList, blockUser, unblockUser } = useBlock()
  const confirm = useConfirm()
  const { showToast } = useToast()

  const otherUserId = detail.conversation?.other_user_id
  const iBlockedThem = !!otherUserId && blockedList.some((b) => b.user_id === otherUserId)
  const theyBlockedMe = detail.isBlockedByOther

  useEffect(() => {
    markOnOpen()
  }, [markOnOpen])

  const initializedRef = useRef(false)
  const lastMessageIdRef = useRef<string | null>(null)

  useEffect(() => {
    if (messageState.loading) return

    const messages = messageState.messages
    const last = messages.length > 0 ? messages[messages.length - 1] : null

    if (!initializedRef.current) {
      initializedRef.current = true
      lastMessageIdRef.current = last ? last.id : null
      return
    }

    if (!last) return
    if (lastMessageIdRef.current === last.id) return
    lastMessageIdRef.current = last.id

    if (String(last.sender_id) === String(user?.id)) return

    markConversationAsRead(conversationId).catch(() => {})
  }, [messageState.messages, messageState.loading, user, markConversationAsRead, conversationId])

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
    const toMark = notifications.filter((n) => !n.is_read && String(n.conversation_id) === String(conversationId))
    toMark.forEach((n) => markNotificationAsRead(n.id))
  }, [notifications, conversationId, markNotificationAsRead])

  useEffect(() => {
    if (!highlightParam) return
    if (messageState.loading) return
    if (processedHighlightRef.current === highlightParam) return
    processedHighlightRef.current = highlightParam

    getMessageByIdApi(highlightParam)
      .then(async (msg) => {
        await messageState.jumpToMessage(highlightParam, msg.created_at)
        setHighlightMessageId(highlightParam)
        setTimeout(() => setHighlightMessageId(null), 2000)
      })
      .catch(() => {
        showToast('Tin nhắn đã bị xóa hoặc không tìm thấy', 'info')
      })
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
        onBack={onBack}
        iBlockedThem={iBlockedThem}
        blockedByOther={theyBlockedMe}
        onUnblock={handleToggleBlock}
        onActiveTyping={markOnActiveAction}
      />
      {showInfo && (
        <div className="fixed inset-0 z-40 md:static md:inset-auto md:z-auto flex">
          <InfoPanel
            conversationId={conversationId}
            detail={detail}
            isBlocked={iBlockedThem}
            onToggleBlock={handleToggleBlock}
            onJumpToMessage={jumpTo}
            onClose={onToggleInfo}
          />
        </div>
      )}
    </>
  )
}

export default ChatPage