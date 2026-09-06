import { useState, useEffect } from 'react'
import { useConversationMedia } from '../../hooks/useConversationMedia'
import type { MediaItem } from '../../types/media.types'

interface MediaFilePanelProps {
  conversationId: string
  onBack: () => void
}

function formatSize(bytes?: number) {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`
}

function groupByMonth(items: MediaItem[]) {
  const groups: Record<string, MediaItem[]> = {}
  items.forEach((item) => {
    const d = new Date(item.created_at)
    const key = `Tháng ${d.getMonth() + 1}`
    if (!groups[key]) groups[key] = []
    groups[key].push(item)
  })
  return groups
}

function MediaFilePanel({ conversationId, onBack }: MediaFilePanelProps) {
  const { summary, items, loading, fetchSummary, fetchList } = useConversationMedia(conversationId)
  const [tab, setTab] = useState<'media' | 'file'>('media')
  const [mediaFilter, setMediaFilter] = useState<'image' | 'video'>('image')

  useEffect(() => { fetchSummary() }, [fetchSummary])
  useEffect(() => {
    fetchList(tab === 'file' ? 'file' : mediaFilter)
  }, [tab, mediaFilter, fetchList])

  const grouped = tab === 'media' ? groupByMonth(items) : null

  return (
    <div className="flex flex-col w-full md:w-72 shrink-0 h-full bg-white border-l border-[#e6ebef] overflow-y-auto">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-[#e6ebef] min-h-[60px]">
        <button onClick={onBack} className="w-7 h-7 rounded-full hover:bg-[#f2f4f6] flex items-center justify-center">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#1a1c1e" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
        </button>
        <h2 className="text-base font-bold text-[#1a1c1e]">File phương tiện và file</h2>
      </div>

      <div className="flex px-4 border-b border-[#e6ebef]">
        {(['media', 'file'] as const).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`py-3 mr-6 text-sm font-semibold border-b-2 transition-colors ${tab === t ? 'border-[#2563eb] text-[#2563eb]' : 'border-transparent text-[#565f71]'}`}
          >
            {t === 'media' ? 'File phương tiện' : 'File'} {t === 'media' ? `(${summary.image + summary.video})` : `(${summary.file})`}
          </button>
        ))}
      </div>

      {tab === 'media' && (
        <div className="flex gap-2 px-4 py-3">
          {(['image', 'video'] as const).map((c) => (
            <button
              key={c}
              onClick={() => setMediaFilter(c)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium ${mediaFilter === c ? 'bg-[#2563eb] text-white' : 'bg-[#f2f4f6] text-[#565f71]'}`}
            >
              {c === 'image' ? 'Ảnh' : 'Video'}
            </button>
          ))}
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 pb-4">
        {loading ? (
          <p className="text-xs text-center text-[#565f71] py-8">Đang tải...</p>
        ) : items.length === 0 ? (
          <p className="text-xs text-center text-[#565f71] py-8">Chưa có {tab === 'media' ? 'file phương tiện' : 'file'} nào</p>
        ) : tab === 'media' ? (
          Object.entries(grouped!).map(([month, list]) => (
            <div key={month} className="mb-4">
              <p className="text-sm font-semibold text-[#1a1c1e] mb-2">{month}</p>
              <div className="grid grid-cols-3 gap-1.5">
                {list.map((item) => (
                  <a key={item.id} href={item.file_url} target="_blank" rel="noopener noreferrer">
                    {item.category === 'image' ? (
                      <img src={item.file_url} alt={item.file_name} className="w-full aspect-square object-cover rounded-lg"/>
                    ) : (
                      <div className="w-full aspect-square bg-[#1a1c1e] rounded-lg flex items-center justify-center">
                        <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
                      </div>
                    )}
                  </a>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="flex flex-col">
            {items.map((f) => (
              <a key={f.id} href={f.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 py-3 border-b border-[#e6ebef] hover:bg-[#f7f9fb]">
                <div className="w-9 h-9 rounded-lg bg-[#f2f4f6] flex items-center justify-center shrink-0">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#565f71" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-[#1a1c1e] truncate">{f.file_name}</p>
                  <p className="text-xs text-[#70787d]">{formatSize(f.file_size)}</p>
                </div>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

export default MediaFilePanel