import ConversationItem from "./ConversationItem"
import { useConversationContext } from '../../../contexts/ConversationContext'
import { getLastMessagePreview } from '../../../utils/messagePreview'
import { useSidebarTyping } from '../../../hooks/useSidebarTyping'
import { useAuth } from '../../../hooks/useAuth'
import { isAfterBySecond } from "../../../utils/timeCompare"

interface ConversationListProps {
  selectedId: string | null
  onSelect: (id: string) => void
}

function ConversationList({ selectedId, onSelect }: ConversationListProps) {
  const { conversations, loading } = useConversationContext()
  const typingConversations = useSidebarTyping()
  const { user } = useAuth()

  if (loading) return <div className="p-4 text-sm text-[#565f71]">Đang tải...</div>
  

  return (
    <div className="flex flex-col gap-1 overflow-y-auto flex-1 px-2 py-2">
      {conversations.map((c) => {
        const isUnread = !!(
          c.last_message &&
          String(c.last_message.sender_id) !== String(user?.id) &&
          (!c.last_read_at || isAfterBySecond(c.last_message.created_at, c.last_read_at))
        )

        return (
          <div key={c.id} onClick={() => onSelect(String(c.id))}>
            <ConversationItem
            name={c.name}
            lastMessage={getLastMessagePreview(c.last_message)}
            time={c.last_message?.created_at}
            avatar={c.avatar_url}
            isActive={String(c.id) === selectedId}
            isTyping={typingConversations.has(String(c.id))}
            isUnread={isUnread}
            conversationType={c.type}
            memberAvatars={c.member_avatars}
          />
          </div>
        )
      })}
    </div>
  )
}

export default ConversationList