import type { ReactNode } from 'react'

interface AuthTemplateProps {
  children: ReactNode
}

function AuthTemplate({ children }: AuthTemplateProps) {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[#e8eef7] to-[#f7f9fb]">
      <div className="w-full max-w-sm rounded-2xl shadow-lg p-8 bg-white">
        {/* Logo */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3 bg-[#2563eb]">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="white">
              <path d="M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm-2 12H6v-2h12v2zm0-3H6V9h12v2zm0-3H6V6h12v2z"/>
            </svg>
          </div>
          <h1 className="text-xl font-bold text-[#2563eb]">Mini Chat</h1>
        </div>

        {children}
      </div>
    </div>
  )
}

export default AuthTemplate