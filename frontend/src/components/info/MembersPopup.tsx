import { useState, useEffect } from 'react'
import { getConversationMembersApi } from '../../api/conversation.api'
import type { ConversationMember } from '../../types/conversation.types'
import { DEFAULT_AVATAR_URL } from '../../constants'
import { useConfirm } from '../../hooks/useConfirm'
import { useNavigate } from 'react-router-dom'
import { useConversation } from '../../hooks/useConversation'
import { useToast } from '../../hooks/useToast'
import { usePresenceContext } from '../../contexts/PresenceContext'
import AddMemberPopup from './AddMemberPopup'
import { getSocket } from '../../socket/socketClient'

interface MenuPos { x: number; y: number }

interface MembersPopupProps {
  conversationId: string
  isAdmin: boolean
  currentUserId?: string
  onClose: () => void
  onMemberRemoved?: () => void
}

function MembersPopup({ conversationId, isAdmin, currentUserId, onClose, onMemberRemoved }: MembersPopupProps) {
  const [members, setMembers] = useState<ConversationMember[]>([])
  const [tab, setTab] = useState<'all' | 'admin'>('all')
  const [openMenuId, setOpenMenuId] = useState<string | null>(null)
  const [menuPos, setMenuPos] = useState<MenuPos>({ x: 0, y: 0 })
  const [showAddMember, setShowAddMember] = useState(false)
  const confirm = useConfirm()
  const navigate = useNavigate()
  const { removeMember, openPrivateConversation, changeMemberRole } = useConversation()
  const { showToast } = useToast()
  const { isOnline, seedOnlineStatus } = usePresenceContext()

  const fetchMembers = () => {
    getConversationMembersApi(conversationId).then((mem) => {
      setMembers(mem)
      mem.forEach((m) => seedOnlineStatus(m.id, !!m.is_online, m.last_seen_at))
    })
  }

  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    const handleRoleChanged = ({ conversationId: cid, userId, role }: { conversationId: number; userId: number; role: string }) => {
      if (String(cid) !== conversationId) return
      setMembers((prev) => prev.map((m) => (String(m.id) === String(userId) ? { ...m, role: role as 'admin' | 'member' } : m)))
    }

    socket.on('conversation:role-changed', handleRoleChanged)
    return () => { socket.off('conversation:role-changed', handleRoleChanged) }
  }, [conversationId])

  useEffect(() => {
    fetchMembers()
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

  const handleMessage = async (memberId: string) => {
    try {
      const conv = await openPrivateConversation(memberId)
      navigate(`/chat/${conv.id}`)
      onClose()
    } catch {
      showToast('Không thể mở đoạn chat', 'error')
    }
  }

  const handleKick = async (memberId: string, memberName: string) => {
    setOpenMenuId(null)
    const ok = await confirm({
      title: 'Xoá thành viên',
      message: `Xoá ${memberName} khỏi nhóm?`,
      confirmText: 'Xoá',
      danger: true,
    })
    if (!ok) return
    try {
      await removeMember(conversationId, memberId)
      setMembers((prev) => prev.filter((m) => m.id !== memberId))
      showToast('Đã xoá thành viên', 'info')
      onMemberRemoved?.()
    } catch {
      showToast('Không thể xoá thành viên', 'error')
    }
  }

  const handleTransferAdmin = async (memberId: string, memberName: string) => {
    setOpenMenuId(null)
    if (!currentUserId) return
    const ok = await confirm({
      title: 'Chuyển quyền quản trị viên',
      message: `Chuyển quyền quản trị viên cho ${memberName}? Bạn sẽ trở thành thành viên thường sau khi xác nhận.`,
      confirmText: 'Chuyển quyền',
      danger: true,
    })
    if (!ok) return
    try {
      await changeMemberRole(conversationId, memberId, 'admin')
      await changeMemberRole(conversationId, currentUserId, 'member')
      // KHÔNG tự setMembers ở đây nữa — chờ "conversation:role-changed" từ
      // socket vòng về (bắn cho cả room, kể cả chính người thao tác), đảm bảo
      // MembersPopup và InfoPanel dùng chung 1 nguồn sự thật duy nhất
      showToast('Đã chuyển quyền quản trị viên', 'success')
    } catch {
      showToast('Không thể chuyển quyền, vui lòng thử lại', 'error')
    }
  }

  const handleViewProfile = (memberId: string) => {
    navigate(`/contacts?userId=${memberId}`)
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose}/>

      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div className="bg-white rounded-2xl shadow-xl w-[calc(100vw-2rem)] max-w-[480px] max-h-[85vh] flex flex-col pointer-events-auto">

          <div className="flex items-center justify-between px-6 py-4 border-b border-[#e6ebef]">
            <div className="w-7"/>
            <h2 className="text-base font-bold text-[#1a1c1e]">Thành viên</h2>
            <button onClick={onClose} className="w-7 h-7 rounded-full bg-[#f2f4f6] hover:bg-[#e6ebef] flex items-center justify-center transition-colors">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#565f71" strokeWidth="2.5">
                <path d="M18 6 6 18M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <div className="flex justify-between items-center px-6 border-b border-[#e6ebef]">
            <div>
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

            {isAdmin && (
              <button
                onClick={() => setShowAddMember(true)}
                title="Thêm thành viên"
                className="w-8 h-8 rounded-full hover:bg-[#f2f4f6] flex items-center justify-center transition-colors"
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M2 21c0-4 3.1-7 7-7s7 3 7 7"/>
                  <line x1="19" y1="8" x2="19" y2="14"/>
                  <line x1="16" y1="11" x2="22" y2="11"/>
                </svg>
              </button>
            )}
          </div>

          <div className="overflow-y-auto flex-1 py-2">
            {filtered.map((m) => {
              const isSelf = currentUserId && String(m.id) === String(currentUserId)
              const isDeactivated = (m as any).is_deactivated
              return (
                <div key={m.id} className={`flex items-center gap-3 px-6 py-3 hover:bg-[#f7f9fb] transition-colors ${isDeactivated ? 'opacity-50' : ''}`}>
                  <div className="relative shrink-0">
                    <img src={m.avatar_url || DEFAULT_AVATAR_URL} alt={m.name} className="w-11 h-11 rounded-full object-cover"/>
                    {isOnline(m.id) && !isDeactivated && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-[#31a24c] rounded-full border-2 border-white"/>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1a1c1e]">{m.name}{isSelf && ' (Bạn)'}</p>
                    <p className="text-xs text-[#565f71] truncate">{m.role === 'admin' ? 'Quản trị viên' : 'Thành viên'}</p>
                  </div>
                  {!isSelf && (!isDeactivated || isAdmin) && (
                    <button onMouseDown={(e) => handleOpenMenu(e, m.id)} className="w-8 h-8 rounded-full hover:bg-[#f2f4f6] flex items-center justify-center shrink-0 transition-colors">
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#565f71" strokeWidth="2">
                        <circle cx="12" cy="12" r="1"/><circle cx="19" cy="12" r="1"/><circle cx="5" cy="12" r="1"/>
                      </svg>
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      {openMenuId !== null && (() => {
        const targetMember = members.find((m) => m.id === openMenuId)
        if (!targetMember) return null
        const isTargetDeactivated = (targetMember as any).is_deactivated

        if (isTargetDeactivated) {
          if (!isAdmin) return null
          return (
            <div className="fixed z-[60] bg-white rounded-xl shadow-lg border border-[#e6ebef] w-52" style={{ top: menuPos.y, left: menuPos.x }} onMouseDown={(e) => e.stopPropagation()}>
              <button onClick={() => handleKick(targetMember.id, targetMember.name)} className="rounded-lg flex items-center gap-3 px-4 py-2.5 hover:bg-[#f7f9fb] w-full text-left transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ba1a1a" strokeWidth="2">
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M2 21c0-4 3.1-7 7-7s7 3 7 7"/>
                  <path d="M18 6l5 5M23 6l-5 5"/>
                </svg>
                <span className="text-sm text-[#ba1a1a]">Xoá khỏi nhóm</span>
              </button>
            </div>
          )
        } 
        return (
          <div className="fixed z-[60] bg-white rounded-xl shadow-lg border border-[#e6ebef] w-52" style={{ top: menuPos.y, left: menuPos.x }} onMouseDown={(e) => e.stopPropagation()}>
            <button onClick={() => handleMessage(targetMember.id)} className="rounded-lg flex items-center gap-3 px-4 py-2.5 hover:bg-[#f7f9fb] w-full text-left transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a1c1e" strokeWidth="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              <span className="text-sm text-[#1a1c1e]">Nhắn tin</span>
            </button>

            <button onClick={() => handleViewProfile(targetMember.id)} className="rounded-lg flex items-center gap-3 px-4 py-2.5 hover:bg-[#f7f9fb] w-full text-left transition-colors">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a1c1e" strokeWidth="2">
                <circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
              </svg>
              <span className="text-sm text-[#1a1c1e]">Xem trang cá nhân</span>
            </button>

            {isAdmin && targetMember.role !== 'admin' && (
              <button onClick={() => handleTransferAdmin(targetMember.id, targetMember.name)} className="rounded-lg flex items-center gap-3 px-4 py-2.5 hover:bg-[#f7f9fb] w-full text-left transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                  <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"/>
                  <line x1="16" y1="8" x2="2" y2="22"/>
                  <line x1="17.5" y1="15" x2="9" y2="15"/>
                </svg>
                <span className="text-sm text-[#1a1c1e]">Chuyển quyền quản trị viên</span>
              </button>
            )}

            {isAdmin && (
              <button onClick={() => handleKick(targetMember.id, targetMember.name)} className="rounded-lg flex items-center gap-3 px-4 py-2.5 hover:bg-[#f7f9fb] w-full text-left transition-colors">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ba1a1a" strokeWidth="2">
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M2 21c0-4 3.1-7 7-7s7 3 7 7"/>
                  <path d="M18 6l5 5M23 6l-5 5"/>
                </svg>
                <span className="text-sm text-[#ba1a1a]">Xoá khỏi nhóm</span>
              </button>
            )}
          </div>
        )
      })()}

      {showAddMember && (
        <AddMemberPopup
          conversationId={conversationId}
          currentMembers={members}
          onClose={() => setShowAddMember(false)}
          onAdded={() => { fetchMembers(); setShowAddMember(false) }}
        />
      )}
    </>
  )
}

export default MembersPopup