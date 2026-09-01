import { usePresenceContext } from '../../../contexts/PresenceContext'
import GroupAvatar from '../../ui/GroupAvatar'
import type { ConversationMember } from '../../../types/conversation.types'

interface ChatHeaderProps {
  displayName: string
  displayAvatar?: string
  onToggleInfo: () => void
  conversationType?: string
  otherUserId?: string | null
  groupAvatarUrl?: string | null
  members?: ConversationMember[]
}

function ChatHeader({ displayName, displayAvatar, onToggleInfo, conversationType, otherUserId, groupAvatarUrl, members }: ChatHeaderProps) {
  const { isOnline } = usePresenceContext()
  const isPrivate = conversationType === 'private'
  const online = isPrivate && isOnline(otherUserId)

  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-[#e6ebef]">
      <button className="flex items-center gap-3 rounded-xl px-2 py-1 transition-colors cursor-default">
        <div className="relative">
          {conversationType === 'group' ? (
            <GroupAvatar avatarUrl={groupAvatarUrl} memberAvatars={members?.map((m) => m.avatar_url)} size={40} />
          ) : (
            <img src={displayAvatar} alt="avatar" className="w-10 h-10 rounded-full object-cover"/>
          )}
          {online && (
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#31a24c] rounded-full border-2 border-white"/>
          )}
        </div>
        <div className="text-left">
          <p className="text-sm font-semibold text-[#1a1c1e]">{displayName}</p>
          {online && <p className="text-xs text-[#31a24c]">Đang hoạt động</p>}
        </div>
      </button>

      <div className="flex items-center gap-1">
        <button onClick={onToggleInfo} className="w-9 h-9 rounded-full hover:bg-[#f2f4f6] flex items-center justify-center">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
            <circle cx="12" cy="12" r="10"/>
            <circle cx="12" cy="8" r="0.5" fill="#2563eb"/>
            <line x1="12" y1="11" x2="12" y2="17"/>
          </svg>
        </button>
      </div>
    </div>
  )
}

export default ChatHeader