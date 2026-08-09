// ConversationItem.tsx — bản rút gọn, bỏ hẳn isOnline
interface ConversationItemProps {
  name: string
  lastMessage?: string
  time?: string
  avatar: string
  isActive?: boolean
}

function ConversationItem({ name, lastMessage, avatar, isActive }: ConversationItemProps) {
  return (
    <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-[#f2f4f6] ${isActive ? 'bg-[#ecf0f3]' : ''}`}>
      <img src={avatar||undefined} alt={name} className="w-10 h-10 rounded-full object-cover shrink-0"/>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center gap-2">
          <span className="text-sm font-semibold text-[#1a1c1e] truncate">{name}</span>
          {/* {time && <span className="text-xs text-[#70787d] shrink-0">{formatTime(time)}</span>} */}
        </div>
        <p className="text-xs text-[#565f71] truncate">{lastMessage || 'Chưa có tin nhắn'}</p>
      </div>
    </div>
  )
}

export default ConversationItem