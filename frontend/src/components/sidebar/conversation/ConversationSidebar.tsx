import { useState } from 'react'
import ConversationList from './ConversationList'
import CreateGroupPopup from './CreateGroupPopup'

interface ConversationSidebarProps {
  selectedId: string | null
  onSelect: (id: string) => void
}

function ConversationSidebar({ selectedId, onSelect }: ConversationSidebarProps) {
  const [showCreate, setShowCreate] = useState(false)

  return (
    <>
      <div className="flex h-full shrink-0 border-r border-[#e6ebef]">
        <div className="flex flex-col flex-1 bg-white min-w-[330px]">
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#e6ebef] min-h-[60px]">
            <h2 className="text-base font-bold text-[#1a1c1e]">Đoạn chat</h2>
            <button onClick={() => setShowCreate(true)} className="w-8 h-8 rounded-full hover:bg-[#f2f4f6] flex items-center justify-center transition-colors" title="Tạo nhóm">
              <svg width="16" height="16" viewBox="0 0 28 24" fill="none" stroke="#565f71" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                <circle cx="9" cy="7" r="4"/>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                {/* Dấu + dịch thêm phải 3px, lên 1px: tâm (24, 10) */}
                <line x1="24" y1="7" x2="24" y2="13"/>
                <line x1="21" y1="10" x2="27" y2="10"/>
              </svg>
            </button>
          </div>
          <div className="px-3 py-2">
            <div className="flex items-center gap-2 bg-[#f2f4f6] rounded-full px-3 py-2">
              <input type="text" placeholder="Tìm kiếm tin nhắn..." className="flex-1 text-xs bg-transparent outline-none text-[#1a1c1e] placeholder:text-[#70787d]" />
            </div>
          </div>
          <ConversationList selectedId={selectedId} onSelect={onSelect} />
        </div>
      </div>
      {showCreate && <CreateGroupPopup onClose={() => setShowCreate(false)} />}
    </>
  )
}

export default ConversationSidebar