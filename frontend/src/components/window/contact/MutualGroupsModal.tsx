// src/components/contact/MutualGroupsModal.tsx
import { useNavigate } from 'react-router-dom'
import type { MutualGroup } from '../../../types/mutual.types'
import GroupAvatar from '../../ui/GroupAvatar'

interface MutualGroupsModalProps {
  groups: MutualGroup[]
  onClose: () => void
}

function MutualGroupsModal({ groups, onClose }: MutualGroupsModalProps) {
  const navigate = useNavigate()

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose}/>
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div className="bg-white rounded-2xl shadow-xl w-[400px] max-h-[500px] flex flex-col pointer-events-auto">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#e6ebef]">
            <div className="w-7"/>
            <h2 className="text-base font-bold text-[#1a1c1e]">Nhóm chung ({groups.length})</h2>
            <button onClick={onClose} className="w-7 h-7 rounded-full bg-[#f2f4f6] hover:bg-[#e6ebef] flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#565f71" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>

          <div className="overflow-y-auto flex-1 p-2">
            {groups.map((g) => (
              <div
                key={g.id}
                onClick={() => { navigate(`/chat/${g.id}`); onClose() }}
                className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#f7f9fb] cursor-pointer transition-colors"
              >
                <GroupAvatar avatarUrl={g.avatar_url} memberAvatars={g.member_avatars} size={44} className="shrink-0" />
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#1a1c1e] truncate">{g.name}</p>
                  <p className="text-xs text-[#565f71]">{g.member_count} thành viên</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

export default MutualGroupsModal