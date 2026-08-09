import ContactList from './ContactList'
import type { SearchedContact } from '../../../types/friendship.types'

interface ContactsSidebarProps {
  list: SearchedContact[]
  selectedId: string | null
  onSelect: (contact: SearchedContact) => void
  onSearch: (value: string) => void
  loading?: boolean
}

function ContactsSidebar({ list, selectedId, onSelect, onSearch, loading }: ContactsSidebarProps) {
  return (
    <div className="flex flex-col bg-white min-w-[330px] border-r border-[#e6ebef]">
      <div className="px-4 py-3 border-b border-[#e6ebef] min-h-[60px] flex items-center">
        <h2 className="text-base font-bold text-[#1a1c1e]">Danh bạ</h2>
      </div>
      <div className="px-3 py-2">
        <div className="flex items-center gap-2 bg-[#f2f4f6] rounded-full px-3 py-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#70787d" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Tìm kiếm theo số điện thoại..."
            onChange={(e) => onSearch(e.target.value)}
            className="flex-1 text-xs bg-transparent outline-none text-[#1a1c1e] placeholder:text-[#70787d]"
          />
        </div>
      </div>
      <ContactList list={list} selectedId={selectedId} onSelect={onSelect} loading={loading} />
    </div>
  )
}

export default ContactsSidebar