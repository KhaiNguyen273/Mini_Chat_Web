import type { ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'

interface ProfileHeaderProps {
  title: string
  children?: ReactNode
}

function ProfileHeader({ title, children }: ProfileHeaderProps) {
  const navigate = useNavigate()
  return (
    <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-[#e6ebef] min-h-[60px]">
      <div className="flex items-center gap-2 min-w-0">
        <button onClick={() => navigate('/profile')} className="w-8 h-8 rounded-full hover:bg-[#f2f4f6] flex items-center justify-center shrink-0 md:hidden">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a1c1e" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <h2 className="text-base font-bold text-[#1a1c1e] truncate">{title}</h2>
      </div>
      {children}
    </div>
  )
}

export default ProfileHeader