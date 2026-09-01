import { useNavigate, useLocation } from 'react-router-dom'
import { usePending } from '../../hooks/usePending'
import { useAuth } from '../../hooks/useAuth'
import { DEFAULT_AVATAR_URL } from '../../constants'
import { useNotification } from '../../hooks/useNotification'

function SidebarNav() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { pendingList } = usePending()
  const { user } = useAuth()
  const { unreadCount } = useNotification()
  
  

  const isActive = (path: string) => pathname.startsWith(path)

  return (
    <div className="flex flex-col items-center justify-between w-14 h-full py-4 bg-white border-r border-[#e6ebef]">
      <div className="flex flex-col items-center gap-4">

        <div className="w-9 h-9 rounded-xl bg-[#2563eb] flex items-center justify-center mb-2">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="white">
            <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
          </svg>
        </div>

        <button
          onClick={() => navigate('/chat')}
          className={`w-9 h-9 rounded-xl flex items-center justify-center ${isActive('/chat') ? 'bg-[#d7e3ff]' : 'hover:bg-[#f2f4f6]'}`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={isActive('/chat') ? '#2563eb' : '#565f71'} strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
          </svg>
        </button>

        <button
          onClick={() => navigate('/contacts')}
          className={`w-9 h-9 rounded-xl flex items-center justify-center ${isActive('/contacts') ? 'bg-[#d7e3ff]' : 'hover:bg-[#f2f4f6]'}`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={isActive('/contacts') ? '#2563eb' : '#565f71'} strokeWidth="2">
            <circle cx="12" cy="8" r="4"/>
            <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/>
          </svg>
        </button>

        <button
          onClick={() => navigate('/pending')}
          className={`w-9 h-9 rounded-xl flex items-center justify-center relative ${isActive('/pending') ? 'bg-[#d7e3ff]' : 'hover:bg-[#f2f4f6]'}`}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke={isActive('/pending') ? '#2563eb' : '#565f71'} strokeWidth="2">
            <rect x="3" y="3" width="18" height="18" rx="3"/>
            <path d="M12 8v8M8 13l4 4 4-4"/>
          </svg>
          {pendingList.length > 0 && (
            <span className="absolute top-1 right-1 w-2 h-2 bg-[#ba1a1a] rounded-full"/>
          )}
        </button>

      </div>

      <button
        onClick={() => navigate('/profile')}
        className={`relative w-9 h-9 rounded-full border-2 transition-all ${isActive('/profile') ? 'border-[#2563eb]' : 'border-transparent hover:border-[#70787d]'}`}
      >
        <div className="w-full h-full rounded-full overflow-hidden">
          <img src={user?.avatar_url||DEFAULT_AVATAR_URL} alt="avatar" className="w-full h-full object-cover"/>
        </div>
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 w-2.5 h-2.5 bg-[#ba1a1a] rounded-full border-2 border-white"/>
        )}
      </button>
    </div>
  )
}

export default SidebarNav