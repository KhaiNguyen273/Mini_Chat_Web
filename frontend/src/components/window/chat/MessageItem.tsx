import { useState, useRef, useEffect } from 'react'
import type { Attachment } from "../../../types/message.types"
import { DEFAULT_AVATAR_URL } from "../../../constants"
import { useConfirm } from "../../../hooks/useConfirm"
import { formatSeenTime } from '../../../utils/formatLastSeen'

interface ReaderInfo {
  id: string
  name: string
  avatar_url?: string
  readAt: string
}

interface MessageItemProps {
  id: string
  content: string
  isMine: boolean
  time?: string
  avatar?: string
  attachments?: Attachment[]
  isPinned?: boolean
  onTogglePin?: (messageId: string, isPinned: boolean) => void
  onDelete?: (messageId: string) => void
  isHighlighted?: boolean
  type?: string
  isDeleted?: boolean
  readers?: ReaderInfo[]
}

function isImage(fileType?: string, fileName?: string) {
  if (fileType?.startsWith('image/')) return true
  const ext = fileName?.split('.').pop()?.toLowerCase()
  return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')
}

function FileIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
      <polyline points="14 2 14 8 20 8"/>
    </svg>
  )
}

function formatFileSize(bytes?: number) {
  if (!bytes) return ''
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

function MessageItem({ id, content, isMine, time, avatar, attachments, isPinned, onTogglePin, onDelete, isHighlighted, type, isDeleted, readers }: MessageItemProps) {
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef<HTMLDivElement>(null)
  const confirm = useConfirm()

  useEffect(() => {
    if (!showMenu) return
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setShowMenu(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [showMenu])

  if (type === 'system') {
    return (
      <div className="flex justify-center py-1">
        <span className="text-xs text-[#70787d] bg-[#f2f4f6] px-3 py-1 rounded-full">{content}</span>
      </div>
    )
  }

  const handleDeleteClick = async () => {
    setShowMenu(false)
    const ok = await confirm({
      title: 'Thu hồi tin nhắn',
      message: 'Tin nhắn đã thu hồi sẽ không thể khôi phục. Bạn chắc chắn chứ?',
      confirmText: 'Thu hồi',
      danger: true,
    })
    if (!ok) return
    onDelete?.(id)
  }

  const handlePinClick = () => {
    setShowMenu(false)
    onTogglePin?.(id, !!isPinned)
  }

  // tách riêng khối avatar người đọc — LUÔN nằm ở góc phải (justify-end,
  // w-full) bất kể tin nhắn của mình hay người khác, không nằm trong cột
  // căn lề items-end/items-start nữa
  const readersRow = readers && readers.length > 0 && (
    <div className="flex justify-end gap-0.5 w-full pr-1">
      {readers.slice(0, 3).map((r) => (
        <div key={r.id} className="relative group/reader">
          <img
            src={r.avatar_url || DEFAULT_AVATAR_URL}
            alt={r.name}
            className="w-4 h-4 rounded-full object-cover border border-white cursor-default"
          />
          <div
            className="absolute bottom-full right-0 mb-1.5 hidden group-hover/reader:block
              whitespace-nowrap px-2.5 py-1.5 rounded-lg bg-[#1a1c1e]/90 text-white text-xs
              pointer-events-none z-30"
          >
            {r.name} đã xem lúc {formatSeenTime(r.readAt)}
          </div>
        </div>
      ))}
    </div>
  )

  if (isDeleted) {
    return (
      <div className="flex flex-col gap-1 w-full">
        <div className={`flex items-end gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
          {!isMine && (
            <img src={avatar || DEFAULT_AVATAR_URL} alt="avatar" className="w-8 h-8 rounded-full object-cover shrink-0"/>
          )}
          <div className={`max-w-xs lg:max-w-md ${isMine ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
            <div className="px-4 py-2.5 rounded-2xl text-sm italic text-[#70787d] bg-[#f2f4f6] border border-dashed border-[#d0d5db]">
              Tin nhắn đã được thu hồi
            </div>
            {time && <span className="text-xs text-[#70787d]">{time}</span>}
          </div>
        </div>
        {readersRow}
      </div>
    )
  }

  const hasAttachments = attachments && attachments.length > 0

  return (
    <div className="flex flex-col gap-1 w-full">
      <div className={`flex items-end gap-2 group ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
        {!isMine && (
          <img src={avatar || DEFAULT_AVATAR_URL} alt="avatar" className="w-8 h-8 rounded-full object-cover shrink-0"/>
        )}
        <div className={`max-w-xs lg:max-w-md ${isMine ? 'items-end' : 'items-start'} flex flex-col gap-1`}>

          {isPinned && (
            <div className="flex items-center gap-1 text-[10px] text-[#70787d]">
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <line x1="12" y1="17" x2="12" y2="22"/>
                <path d="M5 17h14v-1.76a2 2 0 0 0-1.11-1.79l-1.78-.9A2 2 0 0 1 15 10.76V6h1a2 2 0 0 0 0-4H8a2 2 0 0 0 0 4h1v4.76a2 2 0 0 1-1.11 1.79l-1.78.9A2 2 0 0 0 5 15.24Z"/>
              </svg>
              <span>Đã ghim</span>
            </div>
          )}

          {hasAttachments && (
            <div className="flex flex-col gap-1.5">
              {attachments!.filter(a => isImage(a.file_type, a.file_name)).map((a, i) => (
                <a key={i} href={a.file_url} target="_blank" rel="noopener noreferrer">
                  <img
                    src={a.file_url}
                    alt={a.file_name}
                    className="max-w-[220px] max-h-[220px] rounded-2xl object-cover cursor-pointer hover:opacity-90 transition-opacity"
                  />
                </a>
              ))}
              {attachments!.filter(a => !isImage(a.file_type, a.file_name)).map((a, i) => (
                <a
                  key={i}
                  href={a.file_url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex items-center gap-2 px-3 py-2.5 rounded-2xl max-w-[240px] ${
                    isMine ? 'bg-[#2563eb] text-white' : 'bg-[#ecf0f3] text-[#1a1c1e]'
                  }`}
                >
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 ${isMine ? 'bg-white/20' : 'bg-[#d7e3ff]'}`}>
                    <FileIcon />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-medium truncate">{a.file_name}</p>
                    {a.file_size && <p className="text-[10px] opacity-80">{formatFileSize(a.file_size)}</p>}
                  </div>
                </a>
              ))}
            </div>
          )}

          {content && (
            <div className={`relative flex items-center gap-1 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>

              <div className={`px-4 py-2.5 rounded-2xl text-sm transition-all duration-500 ${
                isMine
                  ? 'bg-[#2563eb] text-white rounded-br-sm'
                  : 'bg-[#ecf0f3] text-[#1a1c1e] rounded-bl-sm'
              } ${isHighlighted ? 'ring-2 ring-[#f0cd5b] ring-offset-2' : ''}`}>
                {content}
              </div>

              {(onTogglePin || (isMine && onDelete)) && (
                <div className="relative" ref={showMenu ? menuRef : undefined}>
                  <button
                    onClick={() => setShowMenu((v) => !v)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity w-6 h-6 rounded-full hover:bg-[#f2f4f6] flex items-center justify-center text-[#70787d]"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                      <circle cx="12" cy="5" r="1.5"/>
                      <circle cx="12" cy="12" r="1.5"/>
                      <circle cx="12" cy="19" r="1.5"/>
                    </svg>
                  </button>

                  {showMenu && (
                    <div
                      className={`absolute top-full mt-1 z-20 bg-white rounded-xl shadow-lg border border-[#e6ebef] w-36 py-1 ${isMine ? 'right-0' : 'left-0'}`}
                    >
                      {isMine && onDelete && (
                        <button
                          onClick={handleDeleteClick}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-[#ba1a1a] hover:bg-[#f7f9fb] w-full text-left"
                        >
                          Thu hồi
                        </button>
                      )}
                      {onTogglePin && (
                        <button
                          onClick={handlePinClick}
                          className="flex items-center gap-2 px-3 py-2 text-sm text-[#1a1c1e] hover:bg-[#f7f9fb] w-full text-left"
                        >
                          {isPinned ? 'Bỏ ghim' : 'Ghim'}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {!content && hasAttachments && isHighlighted && (
            <div className="text-[10px] text-[#2563eb] font-medium">↑ Tin nhắn được tìm thấy</div>
          )}

          {time && <span className="text-xs text-[#70787d]">{time}</span>}
        </div>
      </div>

      {readersRow}
    </div>
  )
}

export default MessageItem