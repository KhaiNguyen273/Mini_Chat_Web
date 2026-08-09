import ConversationItem from "./ConversationItem"
import { useConversation } from "../../../hooks/useConversation"
import { DEFAULT_AVATAR_URL } from "../../../constants"

interface ConversationListProps {
  selectedId: string | null
  onSelect: (id: string) => void
}

function ConversationList({ selectedId, onSelect }: ConversationListProps) {
  const { conversations, loading } = useConversation()

  

  if (loading) return <div className="p-4 text-sm text-[#565f71]">Đang tải...</div>

  return (
    <div className="flex flex-col gap-1 overflow-y-auto flex-1 px-2 py-2">
      {conversations.map((c) => (
        <div key={c.id} onClick={() => onSelect(String(c.id))}>
          <ConversationItem
            name={c.name}
            lastMessage={c.last_message?.content}
            avatar={c.avatar_url || DEFAULT_AVATAR_URL}
            isActive={String(c.id) === selectedId}
          />
        </div>
      ))}
    </div>
  )
}

export default ConversationList