import type { ReactNode } from 'react'
import SidebarNav from '../components/sidebar/SidebarNav'
import { useConversation } from '../hooks/useConversation'
import { ConversationContext } from '../contexts/ConversationContext'

interface MainLayoutProps {
  children: ReactNode
}

function MainLayout({ children }: MainLayoutProps) {
  const conversationState = useConversation()

  return (
    <div className="flex h-screen bg-[#f7f9fb] overflow-hidden">
      <SidebarNav />
      <ConversationContext.Provider value={conversationState}>
        {/* pb-14 chừa chỗ cho tab bar cố định dưới màn hình trên mobile;
            md:pb-0 bỏ đi ở desktop vì SidebarNav chuyển sang cột dọc */}
        <div className="flex flex-1 min-h-0 min-w-0 overflow-hidden pb-14 md:pb-0">
          {children}
        </div>
      </ConversationContext.Provider>
    </div>
  )
}

export default MainLayout