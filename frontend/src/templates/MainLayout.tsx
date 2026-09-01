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
        {children}
      </ConversationContext.Provider>
    </div>
  )
}

export default MainLayout