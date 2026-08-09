// PendingList.tsx
import PendingItem from "./PendingItem"
import type { Conversation } from '../../../types/conversation.types'
import { DEFAULT_AVATAR_URL } from "../../../constants"

interface PendingListProps {
  list: Conversation[]
  loading: boolean
  selectedId: string | null
  onSelect: (id: string) => void
}

function PendingList({ list, loading, selectedId, onSelect }: PendingListProps) {
  return (
    <div className="flex flex-col flex-1 overflow-y-auto">
      <div className="px-6 py-4">
        <p className="text-xs font-semibold text-[#565f71] uppercase tracking-wide">Yêu cầu từ người lạ</p>
      </div>

      {loading ? (
        <div className="px-6 py-4 text-sm text-[#565f71]">Đang tải...</div>
      ) : list.length === 0 ? (
        <div className="px-6 py-4 text-sm text-[#565f71]">Không có tin nhắn chờ</div>
      ) : (
        <div className="flex flex-col gap-1 px-2 py-2">
          {list.map((c) => (
            <div key={c.id} onClick={() => onSelect(c.id)}>
              <PendingItem
                name={c.name}
                lastMessage={c.last_message?.content || ''}
                time={c.last_message?.created_at || ''}
                avatar={c.avatar_url || DEFAULT_AVATAR_URL}
                isActive={c.id === selectedId}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default PendingList