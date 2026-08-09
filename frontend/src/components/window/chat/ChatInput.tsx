import { useState, useRef } from 'react'
import type { MessageType } from '../../../types/message.types'
import { useToast } from '../../../hooks/useToast'

interface AttachedFile {
  name: string
  file: File
}

interface ChatInputProps {
  sendMessage: (content: string, type?: MessageType, files?: File[]) => Promise<any>
}

function ChatInput({ sendMessage }: ChatInputProps) {
  const [message, setMessage] = useState('')
  const [attachedFiles, setAttachedFiles] = useState<AttachedFile[]>([])
  const [sending, setSending] = useState(false) // cờ khoá khi đang gửi
  const fileInputRef = useRef<HTMLInputElement>(null)
  const {showToast} = useToast();

  const handleSend = async () => {
    if (sending) return // đang gửi rồi thì bỏ qua, không cho gửi chồng
    if (!message.trim() && attachedFiles.length === 0) return

    const type: MessageType = attachedFiles.some(f => f.file.type.startsWith('image/'))
      ? 'image'
      : attachedFiles.length > 0 ? 'file' : 'text'

    setSending(true)
    try {
      await sendMessage(message, type, attachedFiles.map(f => f.file))
      setMessage('')
      setAttachedFiles([])
    } catch {
      showToast('Gửi tin nhắn thất bại, vui lòng thử lại',"error")
    } finally {
      setSending(false)
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
    const newFiles = files.map(f => ({ name: f.name, file: f }))
    setAttachedFiles(prev => [...prev, ...newFiles])
    e.target.value = ''
  }

  const removeFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index))
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

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        onChange={handleFileChange}
        accept="image/*,.pdf,.doc,.docx,.zip"
        multiple
        disabled={sending}
      />
      <button
        onClick={() => fileInputRef.current?.click()}
        disabled={sending}
        className="w-9 h-9 rounded-full hover:bg-[#f2f4f6] flex items-center justify-center shrink-0 transition-colors mb-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
      >
        <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
          <path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/>
        </svg>
      </button>

      <div className="flex-1 flex flex-col bg-[#f2f4f6] rounded-2xl px-4 py-2 gap-2">

        {attachedFiles.length > 0 && (
          <div className="flex flex-wrap gap-2 pt-1">
            {attachedFiles.map((f, i) => (
              <div
                key={i}
                className="flex items-center gap-2 bg-white rounded-xl px-3 py-2 shadow-sm max-w-[160px] relative group"
              >
                <div className="w-7 h-7 rounded-lg bg-[#d7e3ff] flex items-center justify-center shrink-0">
                  {getFileIcon(f.name)}
                </div>
                <p className="text-xs font-medium text-[#1a1c1e] truncate">{f.name}</p>
                <button
                  onClick={() => removeFile(i)}
                  disabled={sending}
                  className="absolute -top-1.5 -right-1.5 w-5 h-5 rounded-full bg-[#e6ebef] hover:bg-[#ba1a1a] hover:text-white flex items-center justify-center transition-colors disabled:opacity-50"
                >
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M18 6 6 18M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            ))}
          </div>
        )}

        <div className="flex items-center gap-2">
          <input
            type="text"
            placeholder="Aa"
            value={message}
            onChange={e => setMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={sending}
            className="flex-1 text-sm bg-transparent outline-none text-[#1a1c1e] placeholder:text-[#70787d] disabled:opacity-60"
          />
          {!message && attachedFiles.length === 0 && (
            <button className="shrink-0" disabled={sending}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                <circle cx="12" cy="12" r="10"/>
                <path d="M8 14s1.5 2 4 2 4-2 4-2"/>
                <circle cx="9" cy="9" r="0.5" fill="#70787d"/>
                <circle cx="15" cy="9" r="0.5" fill="#70787d"/>
              </svg>
            </button>
          )}
        </div>
      </div>

      {hasContent ? (
        <button
          onClick={handleSend}
          disabled={sending}
          className="w-9 h-9 rounded-full hover:bg-[#f2f4f6] flex items-center justify-center shrink-0 transition-all mb-0.5 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {sending ? (
            <svg className="animate-spin" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
              <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
            </svg>
          ) : (
            <svg width="18" height="18" viewBox="0 0 24 24" fill="#2563eb">
              <path d="M2 21l21-9L2 3v7l15 2-15 2v7z"/>
            </svg>
          )}
        </button>
      ) : (
        <button className="w-9 h-9 rounded-full hover:bg-[#f2f4f6] flex items-center justify-center shrink-0 transition-colors mb-0.5">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
            <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z"/>
            <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/>
          </svg>
        </button>
      )}

    </div>
  )
}

export default ChatInput