import ContactItem from './ContactItem'
import type { SearchedContact } from '../../../types/friendship.types'
import { DEFAULT_AVATAR_URL } from '../../../constants'

interface ContactListProps {
  list: SearchedContact[]
  selectedId: string | null
  onSelect: (contact: SearchedContact) => void
  loading?: boolean
}

function ContactList({ list, selectedId, onSelect, loading }: ContactListProps) {
  if (loading) return <div className="p-4 text-sm text-[#565f71]">Đang tải...</div>

  if (list.length === 0) {
    return <div className="p-4 text-sm text-[#565f71]">Không tìm thấy kết quả</div>
  }

  return (
    <div className="flex flex-col gap-1 overflow-y-auto flex-1 px-2 py-2">
      {list.map((c) => (
        <ContactItem
          key={c.id}
          name={c.name}
          avatar={c.avatar_url || DEFAULT_AVATAR_URL}
          isActive={c.id === selectedId}
          onClick={() => onSelect(c)}
        />
      ))}
    </div>
  )
}

export default ContactList