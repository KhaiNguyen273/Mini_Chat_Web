// src/components/info/MessageSearchPanel.tsx
import { useState, useEffect } from 'react'
import { useDebounce } from '../../hooks/useDebounce'
import { useMessageSearch } from '../../hooks/useMessageSearch'
import type { Message } from '../../types/message.types'

interface MessageSearchPanelProps {
  conversationId: string
  onBack: () => void
  onJumpToMessage: (messageId: string, createdAt: string) => void
}

function highlightText(text: string, keyword: string) {
  if (!keyword.trim()) return text
  const parts = text.split(new RegExp(`(${keyword})`, 'gi'))
  return parts.map((part, i) =>
    part.toLowerCase() === keyword.toLowerCase()
      ? <mark key={i} className="bg-[#ffe680] text-[#1a1c1e] rounded px-0.5">{part}</mark>
      : part
  )
}

function formatDateTime(iso: string) {
  return new Date(iso).toLocaleString('vi-VN', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })
}

function MessageSearchPanel({ conversationId, onBack, onJumpToMessage }: MessageSearchPanelProps) {
  const [keyword, setKeyword] = useState('')
  const debounced = useDebounce(keyword, 400)
  const { results, searching, hasSearched, search } = useMessageSearch(conversationId)

  useEffect(() => { search(debounced) }, [debounced])

  const handleResultClick = (msg: Message) => {
    onJumpToMessage(msg.id, msg.created_at)
    onBack() // đóng panel search, quay về InfoPanel chính
  }

  return (
    <div className="flex flex-col w-72 shrink-0 h-full bg-white border-l border-[#e6ebef]">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#e6ebef] min-h-[60px]">
        <button onClick={onBack} className="w-7 h-7 rounded-full hover:bg-[#f2f4f6] flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a1c1e" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <h2 className="text-base font-bold text-[#1a1c1e]">Tìm kiếm tin nhắn</h2>
      </div>

      <div className="px-4 py-3">
        <div className="flex items-center gap-2 bg-[#f2f4f6] rounded-full px-3 py-2">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#70787d" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
          <input
            type="text"
            placeholder="Nhập từ khoá..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            autoFocus
            className="flex-1 text-sm bg-transparent outline-none text-[#1a1c1e] placeholder:text-[#70787d]"
          />
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {searching ? (
          <p className="text-xs text-center text-[#565f71] py-6">Đang tìm...</p>
        ) : !hasSearched ? (
          <p className="text-xs text-center text-[#70787d] py-6 px-4">Nhập từ khoá để tìm trong đoạn chat này</p>
        ) : results.length === 0 ? (
          <p className="text-xs text-center text-[#565f71] py-6">Không tìm thấy tin nhắn nào</p>
        ) : (
        <div className="flex flex-col gap-1 px-2">
            {results.map((msg) => (
                <div
                key={msg.id}
                onClick={() => handleResultClick(msg)}
                className="p-3 rounded-xl hover:bg-[#f7f9fb] cursor-pointer"
                >
                <p className="text-sm text-[#1a1c1e]">{highlightText(msg.content, debounced)}</p>
                <p className="text-[10px] text-[#70787d] mt-1">{formatDateTime(msg.created_at)}</p>
                </div>
            ))}
        </div>
        )}
      </div>
    </div>
  )
}

export default MessageSearchPanel