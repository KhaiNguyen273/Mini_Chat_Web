import { useState } from 'react'
import MembersPopup from './MembersPopup'
import type { ConversationDetail } from '../../hooks/useConversationDetail'

interface InfoHeaderProps {
  conversationId: string
  detail: ConversationDetail
}

function InfoHeader({ conversationId, detail }: InfoHeaderProps) {
  const [showMembers, setShowMembers] = useState(false)
  const chatType = detail.conversation?.type // "private" | "group", lấy thật từ API thay vì gán cứng

  return (
    <>
      <div className="flex flex-col items-center py-6 border-b border-[#e6ebef]">
        <img
          src={detail.displayAvatar}
          alt="avatar"
          className="w-20 h-20 rounded-full object-cover mb-3 cursor-pointer hover:opacity-90 transition-opacity"
        />
        <p className="text-base font-semibold text-[#1a1c1e]">{detail.displayName}</p>

        <div className="flex gap-4 mt-4">
          {chatType === "private" && (
            <button className="flex flex-col items-center gap-1">
              <div className="w-9 h-9 rounded-full bg-[#f2f4f6] flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#565f71" strokeWidth="2">
                  <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
                </svg>
              </div>
              <span className="text-xs text-[#565f71]">Trang cá nhân</span>
            </button>
          )}

          {chatType === "group" && (
            <button onClick={() => setShowMembers(true)} className="flex flex-col items-center gap-1">
              <div className="w-9 h-9 rounded-full bg-[#f2f4f6] flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#565f71" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <span className="text-xs text-[#565f71]">Thành viên</span>
            </button>
          )}

          <button className="flex flex-col items-center gap-1">
            <div className="w-9 h-9 rounded-full bg-[#f2f4f6] flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#565f71" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </div>
            <span className="text-xs text-[#565f71]">Tìm kiếm</span>
          </button>
        </div>
      </div>

      {showMembers && <MembersPopup conversationId={conversationId} onClose={() => setShowMembers(false)} />}
    </>
  )
}

export default InfoHeader