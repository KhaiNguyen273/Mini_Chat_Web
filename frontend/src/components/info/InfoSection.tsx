import type { ReactNode } from 'react'

interface InfoSectionProps {
  title: string
  children?: ReactNode
}

function InfoSection({ title, children }: InfoSectionProps) {
  return (
    <div className="border-b border-[#e6ebef]">
      <button className="flex items-center justify-between w-full px-4 py-3 hover:bg-[#f2f4f6]">
        <span className="text-sm font-semibold text-[#1a1c1e]">{title}</span>
        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#565f71" strokeWidth="2">
          <path d="m6 9 6 6 6-6"/>
        </svg>
      </button>
      {children}
    </div>
  )
}

export default InfoSection