import { useState } from 'react'
import { useFriendship } from '../../hooks/useFriendship'
import { useToast } from '../../hooks/useToast'
import { useConversationContext } from '../../contexts/ConversationContext'
import { DEFAULT_AVATAR_URL } from '../../constants'
import type { ConversationMember } from '../../types/conversation.types'

interface AddMemberPopupProps {
  conversationId: string
  currentMembers: ConversationMember[]
  onClose: () => void
  onAdded: () => void
}

function AddMemberPopup({ conversationId, currentMembers, onClose, onAdded }: AddMemberPopupProps) {
  const { friends } = useFriendship()
  const { addMember } = useConversationContext()
  const { showToast } = useToast()
  const [search, setSearch] = useState('')
  const [adding, setAdding] = useState<string | null>(null)

  const currentIds = new Set(currentMembers.map((m) => m.id))
  const candidates = friends
    .filter((f) => !currentIds.has(f.id))
    .filter((f) => f.name.toLowerCase().includes(search.toLowerCase()))

  const handleAdd = async (userId: string) => {
    setAdding(userId)
    try {
      await addMember(conversationId, userId)
      showToast('Đã thêm thành viên', 'success')
      onAdded()
    } catch {
      showToast('Không thể thêm thành viên', 'error')
    } finally {
      setAdding(null)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-[80]" onClick={onClose} />
      <div className="fixed inset-0 z-[81] flex items-center justify-center pointer-events-none">
        <div className="bg-white rounded-2xl shadow-xl w-[400px] max-h-[500px] flex flex-col pointer-events-auto">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#e6ebef]">
            <div className="w-7" />
            <h2 className="text-base font-bold text-[#1a1c1e]">Thêm thành viên</h2>
            <button onClick={onClose} className="w-7 h-7 rounded-full bg-[#f2f4f6] hover:bg-[#e6ebef] flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#565f71" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>

          <div className="px-4 py-3 border-b border-[#e6ebef]">
            <div className="flex items-center gap-2 bg-[#f2f4f6] rounded-full px-3 py-2">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#70787d" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
              <input
                type="text"
                placeholder="Tìm bạn bè..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                autoFocus
                className="flex-1 text-xs bg-transparent outline-none text-[#1a1c1e] placeholder:text-[#70787d]"
              />
            </div>
          </div>

          <div className="overflow-y-auto flex-1 py-2">
            {candidates.length === 0 ? (
              <p className="text-sm text-center text-[#565f71] py-8">Không có bạn bè nào để thêm</p>
            ) : (
              candidates.map((u) => (
                <div key={u.id} className="flex items-center gap-3 px-6 py-3 hover:bg-[#f7f9fb] transition-colors">
                  <img src={u.avatar_url || DEFAULT_AVATAR_URL} alt={u.name} className="w-11 h-11 rounded-full object-cover shrink-0"/>
                  <p className="flex-1 text-sm font-semibold text-[#1a1c1e]">{u.name}</p>
                  <button
                    onClick={() => handleAdd(u.id)}
                    disabled={adding === u.id}
                    className="px-3 py-1.5 rounded-lg bg-[#2563eb] text-white text-xs font-semibold hover:opacity-90 disabled:opacity-50"
                  >
                    {adding === u.id ? 'Đang thêm...' : 'Thêm'}
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default AddMemberPopup