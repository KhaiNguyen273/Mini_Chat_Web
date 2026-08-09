import type { ReactNode } from 'react'

interface ProfileHeaderProps {
  title: string
  children?: ReactNode
}

function ProfileHeader({ title, children }: ProfileHeaderProps) {
  return (
    <div className="flex items-center justify-between px-6 py-3 bg-white border-b border-[#e6ebef] min-h-[60px]">
      <h2 className="text-base font-bold text-[#1a1c1e]">{title}</h2>
      {children}
    </div>
  )
}

export default ProfileHeader