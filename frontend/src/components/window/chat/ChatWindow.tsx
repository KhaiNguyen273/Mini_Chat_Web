import { useMessage } from '../../../hooks/useMessage'
import { useAuth } from '../../../hooks/useAuth'
import ChatHeader from './ChatHeader'
import MessageList from './MessageList'
import ChatInput from './ChatInput'
import type { ConversationDetail } from '../../../hooks/useConversationDetail'
import { useTyping } from '../../../hooks/useTyping'

interface ChatWindowProps {
  conversationId: string
  detail: ConversationDetail
  messageState: ReturnType<typeof useMessage>
  highlightMessageId: string | null
  onToggleInfo: () => void
  iBlockedThem: boolean
  blockedByOther: boolean
  onUnblock: () => void
  onActiveTyping?: () => void
  onBack?: () => void
}

function ChatWindow({ conversationId, detail, messageState, highlightMessageId, onToggleInfo, onBack, iBlockedThem, blockedByOther, onUnblock, onActiveTyping }: ChatWindowProps) {
  const { user } = useAuth()
  const { typingUserId, notifyTyping, notifyStopTyping } = useTyping(conversationId)

  const isMine = String(detail.conversation?.created_by) === String(user?.id)
  const status = detail.conversation?.status
  const showPendingBanner = isMine && status === 'pending'
  const showRejectedBanner = isMine && status === 'rejected'
  const isRemovedFromGroup = detail.conversation?.type === 'group' && detail.conversation?.is_member === false

  const handleTyping = () => {
    notifyTyping()
    onActiveTyping?.()
  }

  return (
     <div className="flex flex-col flex-1 h-full bg-[#f7f9fb]">
      <ChatHeader
        displayName={detail.displayName}
        displayAvatar={detail.displayAvatar}
        onToggleInfo={onToggleInfo}
        onBack={onBack}
        conversationType={detail.conversation?.type}
        otherUserId={detail.conversation?.other_user_id}
        groupAvatarUrl={detail.conversation?.avatar_url}
        members={detail.members}
      />

      {showPendingBanner && (
        <div className="px-4 py-2 bg-[#fff8e1] border-b border-[#f5e0a3] text-xs text-[#8a6d1a] text-center">
          Đang chờ {detail.displayName} chấp nhận lời mời nhắn tin
        </div>
      )}
      {showRejectedBanner && (
        <div className="px-4 py-2 bg-[#fff0f0] border-b border-[#ffd0d0] text-xs text-[#ba1a1a] text-center">
          {detail.displayName} đã từ chối lời mời trước đó. Gửi tin nhắn để gửi lại lời mời.
        </div>
      )}

      <MessageList
        conversationId={conversationId}
        displayName={detail.displayName}
        displayAvatar={detail.displayAvatar}
        getAvatarBySender={detail.getAvatarBySender}
        messageState={messageState}
        highlightMessageId={highlightMessageId}
        isOtherTyping={!!typingUserId}
        members={detail.members}
        currentUserId={user?.id}
        conversationType={detail.conversation?.type}
        groupAvatarUrl={detail.conversation?.avatar_url}
      />

      {isRemovedFromGroup ? (
        <div className="flex items-center justify-center px-4 py-4 bg-white border-t border-[#e6ebef]">
          <p className="text-sm text-[#565f71] font-medium">Bạn đã bị loại khỏi đoạn chat</p>
        </div>
      ) : (
        <ChatInput
          sendMessage={messageState.sendMessage}
          iBlockedThem={iBlockedThem}
          blockedByOther={blockedByOther}
          otherUserDeactivated={detail.conversation?.other_user_deactivated}
          onUnblock={onUnblock}
          onTyping={handleTyping}
          onStopTyping={notifyStopTyping}
        />
      )}
    </div>
  )
}

export default ChatWindow