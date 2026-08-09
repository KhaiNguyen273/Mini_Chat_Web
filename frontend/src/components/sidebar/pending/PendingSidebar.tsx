// PendingSidebar.tsx
import PendingList from "../pending/PendingList"
import type { Conversation } from '../../../types/conversation.types'

interface PendingSidebarProps {
  list: Conversation[]
  loading: boolean
  selectedId: string | null
  onSelect: (id: string) => void
}

function PendingSidebar({ list, loading, selectedId, onSelect }: PendingSidebarProps) {
  return (
    <div className="flex flex-col bg-white min-w-[330px] border-r border-[#e6ebef]">
      <div className="px-4 py-3 border-b border-[#e6ebef] min-h-[60px] flex items-center">
        <h2 className="text-base font-bold text-[#1a1c1e]">Tin nhắn chờ</h2>
      </div>
      <PendingList list={list} loading={loading} selectedId={selectedId} onSelect={onSelect} />
    </div>
  )
}

export default PendingSidebar

