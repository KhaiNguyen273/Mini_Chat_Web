import { useMessage } from '../../../hooks/useMessage'
import ChatHeader from './ChatHeader'
import MessageList from './MessageList'
import ChatInput from './ChatInput'
import type { ConversationDetail } from '../../../hooks/useConversationDetail'

interface ChatWindowProps {
  conversationId: string
  detail: ConversationDetail
  onToggleInfo: () => void
}

function ChatWindow({ conversationId, detail, onToggleInfo }: ChatWindowProps) {
  const messageState = useMessage(conversationId)

  return (
    <div className="flex flex-col flex-1 h-full bg-[#f7f9fb]">
      <ChatHeader displayName={detail.displayName} displayAvatar={detail.displayAvatar} onToggleInfo={onToggleInfo} />
      <MessageList
        displayName={detail.displayName}
        displayAvatar={detail.displayAvatar}
        getAvatarBySender={detail.getAvatarBySender}
        messageState={messageState}
      />
      <ChatInput sendMessage={messageState.sendMessage} />
    </div>
  )
}

export default ChatWindow