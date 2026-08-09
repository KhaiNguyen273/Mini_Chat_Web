import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { DEFAULT_AVATAR_URL } from '../../constants'

function ProfileSidebar() {
  const navigate = useNavigate()
  const { pathname } = useLocation()
  const { logout, user } = useAuth()

  const menu = [
    {
      path: '/profile',
      label: 'Chi tiết tài khoản',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="8" r="4"/><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7"/></svg>
    },
    {
      path: '/profile/security',
      label: 'Bảo mật',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><rect x="3" y="11" width="18" height="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
    },
    {
      path: '/profile/notifications',
      label: 'Thông báo',
      icon: <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/></svg>
    },
  ]

  return (
    <div className="flex flex-col bg-white min-w-[330px] border-r border-[#e6ebef] h-full">

      <div className="px-4 py-3 border-b border-[#e6ebef] min-h-[60px] flex items-center">
        <h2 className="text-base font-bold text-[#1a1c1e]">Tài khoản</h2>
      </div>

      <div className="flex flex-col items-center py-6 border-b border-[#e6ebef]">
        <div className="relative mb-2">
          <img
            src={user?.avatar_url || DEFAULT_AVATAR_URL}
            alt={user?.name}
            className="w-16 h-16 rounded-full object-cover"
          />
        </div>
        <p className="text-sm font-bold text-[#1a1c1e]">{user?.name}</p>
      </div>

      <div className="flex flex-col gap-1 p-2 flex-1">
        {menu.map(item => (
          <button
            key={item.path}
            onClick={() => navigate(item.path)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors w-full text-left ${
              pathname === item.path
                ? 'bg-[#ecf0f3] text-[#1a1c1e]'
                : 'hover:bg-[#f2f4f6] text-[#565f71]'
            }`}
          >
            <span className={pathname === item.path ? 'text-[#2563eb]' : 'text-[#565f71]'}>
              {item.icon}
            </span>
            {item.label}
          </button>
        ))}
      </div>

      <div className="p-2 border-t border-[#e6ebef]">
        <button
          onClick={async () => { await logout(); navigate('/login') }}
          className="flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-[#fff0f0] text-sm text-[#ba1a1a] w-full"
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#ba1a1a" strokeWidth="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Đăng xuất
        </button>
      </div>

    </div>
  )
}

export default ProfileSidebar