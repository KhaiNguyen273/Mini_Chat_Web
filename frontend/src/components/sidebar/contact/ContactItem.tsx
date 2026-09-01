import { usePresenceContext } from "../../../contexts/PresenceContext"

interface ContactItemProps {
  id: string
  name: string
  avatar: string
  isActive?: boolean
  onClick?: () => void
}

function ContactItem({ id, name, avatar, isActive, onClick }: ContactItemProps) {
  const { isOnline } = usePresenceContext()

  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer ${
        isActive ? 'bg-[#ecf0f3]' : 'hover:bg-[#f2f4f6]'
      }`}
    >
      <div className="relative shrink-0">
        <img src={avatar} alt={name} className="w-10 h-10 rounded-full object-cover"/>
        {isOnline(id) && (
          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#31a24c] rounded-full border-2 border-white"/>
        )}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-[#1a1c1e] truncate">{name}</p>
      </div>
    </div>
  )
}

export default ContactItem