import type { ConversationMember } from '../../types/conversation.types'
import { DEFAULT_AVATAR_URL } from '../../constants'

interface AssignAdminModalProps {
  candidates: ConversationMember[]
  onSelect: (userId: string) => void
  onClose: () => void
}

function AssignAdminModal({ candidates, onSelect, onClose }: AssignAdminModalProps) {
  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-[90]" onClick={onClose} />
      <div className="fixed inset-0 z-[91] flex items-center justify-center pointer-events-none">
        <div className="bg-white rounded-2xl shadow-xl w-[380px] max-h-[480px] flex flex-col pointer-events-auto">
          <div className="px-6 py-4 border-b border-[#e6ebef]">
            <h2 className="text-base font-bold text-[#1a1c1e]">Chọn quản trị viên mới</h2>
            <p className="text-xs text-[#565f71] mt-1">Bạn là quản trị viên duy nhất. Hãy chọn người thay thế trước khi rời nhóm.</p>
          </div>
          <div className="overflow-y-auto flex-1 py-2">
            {candidates.map((m) => (
              <button
                key={m.id}
                onClick={() => onSelect(m.id)}
                className="flex items-center gap-3 px-6 py-3 hover:bg-[#f7f9fb] w-full text-left transition-colors"
              >
                <img src={m.avatar_url || DEFAULT_AVATAR_URL} alt={m.name} className="w-11 h-11 rounded-full object-cover shrink-0"/>
                <p className="text-sm font-semibold text-[#1a1c1e]">{m.name}</p>
              </button>
            ))}
          </div>
          <div className="px-6 py-4 border-t border-[#e6ebef]">
            <button onClick={onClose} className="w-full py-2.5 rounded-xl bg-[#f2f4f6] text-[#565f71] text-sm font-semibold hover:bg-[#e6ebef]">
              Huỷ
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default AssignAdminModal