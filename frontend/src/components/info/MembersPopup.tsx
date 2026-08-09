import { useState, useEffect } from 'react'
import { getConversationMembersApi } from '../../api/conversation.api'
import type { ConversationMember } from '../../types/conversation.types'

interface MenuPos { x: number; y: number }

interface MembersPopupProps {
  conversationId: string
  onClose: () => void
}

function MembersPopup({ conversationId, onClose }: MembersPopupProps) {
  const [members, setMembers] = useState<ConversationMember[]>([])
  const [tab, setTab] = useState<'all' | 'admin'>('all')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [menuPos, setMenuPos] = useState<MenuPos>({ x: 0, y: 0 })

  useEffect(() => {
    getConversationMembersApi(conversationId).then(setMembers)
  }, [conversationId])

  const filtered = tab === 'admin' ? members.filter((m) => m.role === 'admin') : members

  useEffect(() => {
    const handleClick = () => setOpenMenuId(null)
    document.addEventListener('mousedown', handleClick)
    return () => document.removeEventListener('mousedown', handleClick)
  }, [])

  const handleOpenMenu = (e: React.MouseEvent, id: string) => {
    e.stopPropagation()
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
    setMenuPos({ x: rect.left - 160, y: rect.bottom + 4 })
    setOpenMenuId(openMenuId === id ? null : id)
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose}/>

      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div className="bg-white rounded-2xl shadow-xl w-[480px] max-h-[600px] flex flex-col pointer-events-auto">

          <div className="flex items-center justify-between px-6 py-4 border-b border-[#e6ebef]">
            <div className="w-7"/>
            <h2 className="text-base font-bold text-[#1a1c1e]">Thành viên</h2>
            <button onClick={onClose} className="w-7 h-7 rounded-full bg-[#f2f4f6] hover:bg-[#e6ebef] flex items-center justify-center transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#565f71" strokeWidth="2.5">
                <path d="M18 6 6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <div className="flex px-6 border-b border-[#e6ebef]">
            {['all', 'admin'].map((t) => (
              <button
                key={t}
                onClick={() => setTab(t as 'all' | 'admin')}
                className={`py-3 mr-6 text-sm font-semibold border-b-2 transition-colors ${tab === t ? 'border-[#2563eb] text-[#2563eb]' : 'border-transparent text-[#565f71] hover:text-[#1a1c1e]'}`}
              >
                {t === 'all' ? 'Tất cả' : 'Quản trị viên'}
              </button>
            ))}
          </div>

          <div className="overflow-y-auto flex-1 py-2">
            {filtered.map((m) => (
              <div key={m.id} className="flex items-center gap-3 px-6 py-3 hover:bg-[#f7f9fb] transition-colors">
                <img src={m.avatar_url} alt={m.name} className="w-11 h-11 rounded-full object-cover shrink-0"/>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-[#1a1c1e]">{m.name}</p>
                  <p className="text-xs text-[#565f71] truncate">{m.role === 'admin' ? 'Quản trị viên' : 'Thành viên'}</p>
                </div>
                <button onMouseDown={(e) => handleOpenMenu(e, m.id)} className="w-8 h-8 rounded-full hover:bg-[#f2f4f6] flex items-center justify-center shrink-0 transition-colors">
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#565f71" strokeWidth="2">
                    <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>

        </div>
      </div>

      {openMenuId !== null && (
        <div className="fixed z-[60] bg-white rounded-xl shadow-lg border border-[#e6ebef] w-48" style={{ top: menuPos.y, left: menuPos.x }} onMouseDown={(e) => e.stopPropagation()}>
          <button className="rounded-lg flex items-center gap-3 px-4 py-2.5 hover:bg-[#f7f9fb] w-full text-left transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a1c1e" strokeWidth="2">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            <span className="text-sm text-[#1a1c1e]">Nhắn tin</span>
          </button>
          <button className="rounded-lg flex items-center gap-3 px-4 py-2.5 hover:bg-[#f7f9fb] w-full text-left transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a1c1e" strokeWidth="2">
              <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
            </svg>
            <span className="text-sm text-[#1a1c1e]">Xem trang cá nhân</span>
          </button>
          <button className="rounded-lg flex items-center gap-3 px-4 py-2.5 hover:bg-[#f7f9fb] w-full text-left transition-colors">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ba1a1a" strokeWidth="2">
                <circle cx="9" cy="7" r="4"/>
                <path d="M2 21c0-4 3.1-7 7-7s7 3 7 7"/>
                <path d="M18 6l5 5M23 6l-5 5"/>
            </svg>
            <span className="text-sm text-[#ba1a1a]">Chặn</span>
          </button>
        </div>
      )}
    </>
  )
}

export default MembersPopup