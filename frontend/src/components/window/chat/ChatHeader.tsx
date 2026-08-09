interface ChatHeaderProps {
  displayName: string
  displayAvatar?: string
  onToggleInfo: () => void
}

function ChatHeader({ displayName, displayAvatar, onToggleInfo }: ChatHeaderProps) {
  return (
    <div className="flex items-center justify-between px-4 py-3 bg-white border-b border-[#e6ebef]">
      <button className="flex items-center gap-3 rounded-xl px-2 py-1 transition-colors cursor-default">
        <div className="relative">
          <img src={displayAvatar} alt="avatar" className="w-10 h-10 rounded-full object-cover"/>
        </div>
        <div className="text-left">
          <p className="text-sm font-semibold text-[#1a1c1e]">{displayName}</p>
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