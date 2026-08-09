import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import MainLayout from '../templates/MainLayout'
import Sidebar from '../components/sidebar/conversation/ConversationSidebar'
import InfoPanel from '../components/info/InfoPanel'
import ChatWindow from '../components/window/chat/ChatWindow'
import { useConversationDetail } from '../hooks/useConversationDetail'
import { useConversation } from '../hooks/useConversation'

function ChatPage() {
  const { conversationId } = useParams()
  const navigate = useNavigate()
  const [showInfo, setShowInfo] = useState(true)
  const { conversations, loading } = useConversation()
  const hasAutoSelected = useRef(false)

  useEffect(() => {
    if (conversationId) {
      hasAutoSelected.current = true
      return
    }
    if (!hasAutoSelected.current && !loading && conversations.length > 0) {
      hasAutoSelected.current = true
      navigate(`/chat/${conversations[0].id}`, { replace: true })
    }
  }, [conversationId, loading, conversations, navigate])

  return (
    <MainLayout>
      <Sidebar
        selectedId={conversationId || null}
        onSelect={(id) => navigate(`/chat/${id}`)}
      />
      {conversationId ? (
        <ChatPageContent
          conversationId={conversationId}
          showInfo={showInfo}
          onToggleInfo={() => setShowInfo((prev) => !prev)}
        />
      ) : (
        <div className="flex flex-1 items-center justify-center text-sm text-[#565f71]">
          {loading ? 'Đang tải...' : 'Chưa có đoạn chat nào'}
        </div>
      )}
    </MainLayout>
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
  const detail = useConversationDetail(conversationId)

  return (
    <>
      <ChatWindow conversationId={conversationId} detail={detail} onToggleInfo={onToggleInfo} />
      {showInfo && <InfoPanel conversationId={conversationId} detail={detail} />}
    </>
  )
}

export default ChatPage