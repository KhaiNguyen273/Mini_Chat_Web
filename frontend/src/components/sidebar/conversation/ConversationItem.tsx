import GroupAvatar from "../../ui/GroupAvatar"
import { DEFAULT_AVATAR_URL } from "../../../constants"

interface ConversationItemProps {
  name: string
  lastMessage?: string
  time?: string
  avatar?: string | null
  isActive?: boolean
  isTyping?: boolean
  isUnread?: boolean
  conversationType?: string
  memberAvatars?: (string | undefined)[]
}

function ConversationItem({ name, lastMessage, avatar, isActive, isTyping, isUnread, conversationType, memberAvatars }: ConversationItemProps) {
  
  return (
    <div
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-[#f2f4f6] ${isActive ? 'bg-[#ecf0f3]' : ''}`}
    >
      {conversationType === 'group' ? (
        <GroupAvatar avatarUrl={avatar || null} memberAvatars={memberAvatars} size={40} className="shrink-0" />
      ) : (
        <img src={avatar || DEFAULT_AVATAR_URL} alt={name} className="w-10 h-10 rounded-full object-cover shrink-0"/>
      )}
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center gap-2">
          <span className={`text-sm truncate ${isUnread ? 'font-bold text-[#0a0c0e]' : 'font-semibold text-[#1a1c1e]'}`}>{name}</span>
        </div>
        {isTyping ? (
          <p className="text-xs text-[#2563eb] font-medium truncate">Đang nhập...</p>
        ) : (
          <p className={`text-xs truncate ${isUnread ? 'font-semibold text-[#1a1c1e]' : 'text-[#565f71]'}`}>{lastMessage}</p>
        )}
      </div>
      {isUnread && <span className="w-2 h-2 rounded-full bg-[#2563eb] shrink-0"/>}
    </div>
  )
}

export default ConversationItem