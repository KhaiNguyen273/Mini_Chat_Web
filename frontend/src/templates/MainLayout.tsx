import type { ReactNode } from 'react'
import SidebarNav from '../components/sidebar/SidebarNav'

interface MainLayoutProps {
  children: ReactNode
}

function MainLayout({ children }: MainLayoutProps) {
  return (
    <div className="flex h-screen bg-[#f7f9fb] overflow-hidden">
      <SidebarNav />
      {children}
    </div>
  )
}

export default MainLayout