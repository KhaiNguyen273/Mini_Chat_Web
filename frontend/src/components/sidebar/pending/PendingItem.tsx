interface PendingItemProps {
  name: string
  lastMessage: string
  time: string
  avatar: string
  isActive?: boolean
}

function PendingItem({ name, lastMessage, time, avatar, isActive }: PendingItemProps) {
  return (
    <div className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-[#f2f4f6] ${isActive ? 'bg-[#ecf0f3]' : ''}`}>
      <div className="relative shrink-0">
        <img src={avatar} alt={name} className="w-10 h-10 rounded-full object-cover"/>
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex justify-between items-center">
          <span className="text-sm font-semibold text-[#1a1c1e] truncate">{name}</span>
        </div>
        <p className="text-xs text-[#565f71] truncate">{lastMessage}</p>
      </div>
    </div>
  )
}

export default PendingItem