import { useState, useRef, useEffect } from 'react'
import type { MessageType } from '../../../types/message.types'
import { useConfirm } from '../../../hooks/useConfirm'


interface AttachedFile {
  name: string
  file: File
  previewUrl?: string // chỉ tạo cho ảnh
}

interface ChatInputProps {
  sendMessage: (content: string, type?: MessageType, files?: File[]) => Promise<any>
  iBlockedThem?: boolean
  blockedByOther?: boolean
  otherUserDeactivated?: boolean // MỚI
  onUnblock?: () => void
  onTyping?: () => void
  onStopTyping?: () => void
}

function ChatInput({ sendMessage, iBlockedThem, blockedByOther, otherUserDeactivated, onUnblock, onTyping, onStopTyping }: ChatInputProps) {
  const [message, setMessage] = useState('')
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([])
  const [sending, setSending] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const confirm = useConfirm()

  // dọn URL object khi unmount, tránh leak
  useEffect(() => {
    return () => {
      attachedFiles.forEach((f) => { if (f.previewUrl) URL.revokeObjectURL(f.previewUrl) })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (otherUserDeactivated) {
    return (
      <div className="flex items-center justify-center px-4 py-4 bg-white border-t border-[#e6ebef]">
        <p className="text-sm text-[#565f71] font-medium">Người dùng này hiện không khả dụng</p>
      </div>
    )
  }

  // họ chặn mình — không có quyền làm gì cả, chỉ báo lý do
  if (blockedByOther) {
    return (
      <div className="flex items-center justify-center px-4 py-4 bg-white border-t border-[#e6ebef]">
        <p className="text-sm text-[#ba1a1a] font-medium">Bạn không thể trả lời đoạn chat này</p>
      </div>
    )
  }

  // mình đã chặn họ — có nút Bỏ chặn để thao tác ngay tại đây
  if (iBlockedThem) {
    return (
      <div className="flex items-center justify-center gap-1 px-4 py-4 bg-white border-t border-[#e6ebef]">
        <p className="text-sm text-[#ba1a1a] font-medium">
          Người dùng đã bị chặn —{' '}
          <button onClick={onUnblock} className="underline font-semibold hover:opacity-80">
            Bỏ chặn
          </button>
        </p>
      </div>
    )
  }

  const getSendErrorMessage = (rawMsg: string): string => {
    if (!rawMsg) return 'Gửi tin nhắn thất bại, vui lòng thử lại'
    if (rawMsg.includes('is deactivated')) return 'Người dùng này hiện không khả dụng'
    if (rawMsg.includes('is blocked')) return 'Không thể gửi tin nhắn — người dùng đã bị chặn'
    if (rawMsg.includes('Not a member')) return 'Bạn không còn là thành viên của đoạn chat này'
    return 'Gửi tin nhắn thất bại, vui lòng thử lại'
  }

  const handleSend = async () => {
    if (sending) return
    if (!message.trim() && attachedFiles.length === 0) return

    const type: MessageType = attachedFiles.some(f => f.file.type.startsWith('image/'))
      ? 'image'
      : attachedFiles.length > 0 ? 'file' : 'text'

    setSending(true)
    try {
      await sendMessage(message, type, attachedFiles.map(f => f.file))
      attachedFiles.forEach((f) => { if (f.previewUrl) URL.revokeObjectURL(f.previewUrl) })
      setMessage('')
      setAttachedFiles([])
      onStopTyping?.()
    } catch (err: any) {
      const rawMsg = err.response?.data?.message || err.message
      await confirm({
        title: 'Không thể gửi tin nhắn',
        message: getSendErrorMessage(rawMsg),
        confirmText: 'OK',
        hideCancel: true,
      })
      window.location.reload()
    } finally {
      setSending(false)
      setTimeout(() => inputRef.current?.focus(), 0)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || [])
    const newFiles = files.map((f) => ({
      name: f.name,
      file: f,
      previewUrl: f.type.startsWith('image/') ? URL.createObjectURL(f) : undefined,
    }))
    setAttachedFiles((prev) => [...prev, ...newFiles])
    e.target.value = ''
  }

  const removeFile = (index: number) => {
    setAttachedFiles((prev) => {
      const target = prev[index]
      if (target?.previewUrl) URL.revokeObjectURL(target.previewUrl)
      return prev.filter((_, i) => i !== index)
    })
  }

  const getFileIcon = (name: string) => {
    const ext = name.split('.').pop()?.toLowerCase()
    if (['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')) {
      return (
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <polyline points="21 15 16 10 5 21"/>
        </svg>
      )
    }
    return (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
        <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
        <polyline points="14 2 14 8 20 8"/>
      </svg>
    )
  }

  const hasContent = message.trim() || attachedFiles.length > 0

  return (
    <div className="flex items-end gap-3 px-4 py-3 bg-white border-t border-[#e6ebef]">
      <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileChange} accept="image/*,.pdf,.doc,.docx,.zip" multiple disabled={sending}/>
      <button onClick={() => fileInputRef.current?.click()} disabled={sending}
        className="w-9 h-9 rounded-full hover:bg-[#f2f4f6] flex items-center justify-center shrink-0 transition-colors mb-0.5 disabled:opacity-50 disabled:cursor-not-allowed">
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
          <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
        </svg>
      </button>

      <div className="flex-1 flex flex-col bg-[#f2f4f6] rounded-2xl px-4 py-2 gap-2">
        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {attachedFiles.map((f, i) => (
              <div key={i} className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 shadow-sm max-w-[160px] relative group">
                {f.previewUrl ? (
                  <img src={f.previewUrl} alt={f.name} className="w-7 h-7 rounded-lg object-cover shrink-0" />
                ) : (
                  <div className="w-7 h-7 rounded-lg bg-[#d7e3ff] flex items-center justify-center shrink-0">
                    {getFileIcon(f.name)}
                  </div>
                )}
                <p className="text-xs font-medium text-[#1a1c1e] truncate">{f.name}</p>
                <button onClick={() => removeFile(i)} disabled={sending}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#e6ebef] hover:bg-[#ba1a1a] hover:text-white flex items-center justify-center transition-colors disabled:opacity-50">
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <input ref={inputRef} type="text" placeholder="Aa" value={message}
            onChange={e => { setMessage(e.target.value); onTyping?.() }}
            onKeyDown={handleKeyDown} disabled={sending}
            className="flex-1 text-sm bg-transparent outline-none text-[#1a1c1e] placeholder:text-[#70787d] disabled:opacity-60"/>
        </div>
      </div>

      <button onClick={handleSend} disabled={sending || !hasContent}
        className="w-9 h-9 rounded-full hover:bg-[#f2f4f6] flex items-center justify-center shrink-0 transition-all mb-0.5 disabled:opacity-50 disabled:cursor-not-allowed">
        {sending ? (
          <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><path d="M21 12a9 9 0 1 1-6.219-8.56"/></svg>
        ) : (
          <svg width="18" height="18" viewBox="0 0 24 24" fill="#2563eb"><path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/></svg>
        )}
      </button>
    </div>
  )
}

export default ChatInput