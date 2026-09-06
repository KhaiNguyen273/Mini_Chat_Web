import { useState } from 'react'
import ConversationList from './ConversationList'
import CreateGroupPopup from './CreateGroupPopup'
import { searchConversationsApi } from '../../../api/conversation.api'
import type { ConversationSearchResult } from '../../../api/conversation.api'
import { DEFAULT_AVATAR_URL } from '../../../constants'
import GroupAvatar from '../../ui/GroupAvatar'

interface ConversationSidebarProps {
  selectedId: string | null
  onSelect: (id: string) => void
  className?: string
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

function ConversationSidebar({ selectedId, onSelect, className = 'flex' }: ConversationSidebarProps) {
  const [showCreate, setShowCreate] = useState(false)
  const [keyword, setKeyword] = useState('')
  const [activeQuery, setActiveQuery] = useState('')
  const [results, setResults] = useState<ConversationSearchResult[] | null>(null)
  const [searching, setSearching] = useState(false)

  const runSearch = async () => {
    const q = keyword.trim()
    if (!q) return
    setActiveQuery(q)
    setSearching(true)
    try {
      setResults(await searchConversationsApi(q))
    } finally {
      setSearching(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') runSearch()
  }

  const handleClear = () => {
    setKeyword('')
    setActiveQuery('')
    setResults(null)
  }

  const handleSelectResult = (id: string) => {
    onSelect(id)
    handleClear()
  }

  const isSearchMode = results !== null

  return (
    <>
      <div className={`${className} md:flex flex-col bg-white w-full md:w-[330px] h-full shrink-0 border-r border-[#e6ebef]`}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#e6ebef] min-h-[60px]">
          <h2 className="text-base font-bold text-[#1a1c1e]">Đoạn chat</h2>
          <button onClick={() => setShowCreate(true)} className="w-8 h-8 rounded-full hover:bg-[#f2f4f6] flex items-center justify-center transition-colors" title="Tạo nhóm">
            <svg width="16" height="16" viewBox="0 0 28 24" fill="none" stroke="#565f71" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
              <circle cx="9" cy="7" r="4"/>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
              <line x1="24" y1="7" x2="24" y2="13"/>
              <line x1="21" y1="10" x2="27" y2="10"/>
            </svg>
          </button>
        </div>

        <div className="px-3 py-2">
          <div className="flex items-center gap-2 bg-[#f2f4f6] rounded-full px-3 py-2">
            <button onClick={runSearch} disabled={!keyword.trim()} className="shrink-0 disabled:opacity-40">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#70787d" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </button>
            <input
              type="text"
              placeholder="Tìm kiếm tin nhắn..."
              value={keyword}
              onChange={(e) => setKeyword(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-1 text-xs bg-transparent outline-none text-[#1a1c1e] placeholder:text-[#70787d]"
            />
            {keyword && (
              <button onClick={handleClear} className="shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#70787d" strokeWidth="2.5">
                  <path d="M18 6 6 18M6 6l12 12"/>
                </svg>
              </button>
            )}
          </div>
        </div>

        {isSearchMode ? (
          <div className="flex flex-col gap-1 overflow-y-auto flex-1 px-2 py-2">
            {searching ? (
              <p className="p-4 text-sm text-[#565f71]">Đang tìm...</p>
            ) : results!.length === 0 ? (
              <p className="p-4 text-sm text-[#565f71]">Không tìm thấy kết quả</p>
            ) : (
              results!.map((r) => (
                <div
                  key={r.id}
                  onClick={() => handleSelectResult(r.id)}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer hover:bg-[#f2f4f6]"
                >
                  {r.type === 'group' ? (
                    <GroupAvatar avatarUrl={r.avatar_url} size={40} className="shrink-0" />
                  ) : (
                    <img src={r.avatar_url || DEFAULT_AVATAR_URL} alt={r.name} className="w-10 h-10 rounded-full object-cover shrink-0"/>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1a1c1e] truncate">{r.name}</p>
                    <p className="text-xs text-[#565f71] truncate">
                      {r.match_count > 1 ? `${r.match_count} matched messages` : highlightText(r.last_match_content || '', activeQuery)}
                    </p>
                  </div>
                </div>
              ))
            )}
          </div>
        ) : (
          <ConversationList selectedId={selectedId} onSelect={onSelect} />
        )}
      </div>
      {showCreate && <CreateGroupPopup onClose={() => setShowCreate(false)} />}
    </>
  )
}

export default ConversationSidebar