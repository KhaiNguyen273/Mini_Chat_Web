import type { Attachment } from "../../../types/message.types"
import { DEFAULT_AVATAR_URL } from "../../../constants"

interface MessageItemProps {
  content: string
  isMine: boolean
  time?: string
  avatar?: string
  attachments?: Attachment[]
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

function MessageItem({ content, isMine, time, avatar, attachments }: MessageItemProps) {
  const hasAttachments = attachments && attachments.length > 0

  return (
    <div className={`flex items-end gap-2 ${isMine ? 'flex-row-reverse' : 'flex-row'}`}>
      {!isMine && (
        <img src={avatar || DEFAULT_AVATAR_URL} alt="avatar" className="w-8 h-8 rounded-full object-cover shrink-0"/>
      )}
      <div className={`max-w-xs lg:max-w-md ${isMine ? 'items-end' : 'items-start'} flex flex-col gap-1`}>

        {/* Ảnh đính kèm */}
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

            {/* File không phải ảnh */}
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

        {/* Nội dung text */}
        {content && (
          <div className={`px-4 py-2.5 rounded-2xl text-sm ${
            isMine
              ? 'bg-[#2563eb] text-white rounded-br-sm'
              : 'bg-[#ecf0f3] text-[#1a1c1e] rounded-bl-sm'
          }`}>
            {content}
          </div>
        )}

        {time && (
          <span className="text-xs text-[#70787d]">{time}</span>
        )}
      </div>
    </div>
  )
}

export default MessageItem