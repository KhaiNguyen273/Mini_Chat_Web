import { useEffect } from "react"
import { usePinnedMessages } from "../../hooks/usePinnedMessages"
import PinIcon from "../ui/PinIcon"
import { DEFAULT_AVATAR_URL } from "../../constants"

interface PinnedMessagesModalProps {
  conversationId: string
  onClose: () => void
  onJumpToMessage: (messageId: string, createdAt: string) => void
}

function isImageAttachment(fileType?: string, fileName?: string) {
  if (fileType?.startsWith('image/')) return true
  const ext = fileName?.split('.').pop()?.toLowerCase()
  return ['jpg', 'jpeg', 'png', 'gif', 'webp'].includes(ext || '')
}

function PinnedMessagesModal({ conversationId, onClose, onJumpToMessage }: PinnedMessagesModalProps) {
  const { pins, loading, fetchPins, unpin } = usePinnedMessages(conversationId)
  useEffect(() => { fetchPins() }, [fetchPins])

  const handleJump = (p: any) => {
    onJumpToMessage(p.message.id, p.message.created_at)
    onClose()
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose}/>
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div className="bg-white rounded-2xl shadow-xl w-[calc(100vw-2rem)] max-w-[420px] max-h-[85vh] flex flex-col pointer-events-auto">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#e6ebef]">
            <div className="w-7"/>
            <h2 className="text-base font-bold text-[#1a1c1e]">Tin nhắn đã ghim</h2>
            <button onClick={onClose} className="w-7 h-7 rounded-full bg-[#f2f4f6] hover:bg-[#e6ebef] flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#565f71" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>
          <div className="overflow-y-auto flex-1 p-4">
            {loading ? (
              <p className="text-sm text-center text-[#565f71] py-8">Đang tải...</p>
            ) : pins.length === 0 ? (
              <div className="flex flex-col items-center gap-3 py-16">
                <PinIcon size={28} />
                <p className="text-sm font-semibold text-[#1a1c1e]">Chưa ghim tin nhắn nào</p>
                <p className="text-xs text-[#70787d] text-center px-6">Tin nhắn đã ghim trong đoạn chat này sẽ hiển thị ở đây</p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {pins.map((p: any) => {
                  const firstAttachment = p.message.attachments?.[0]
                  const isImg = firstAttachment && isImageAttachment(firstAttachment.file_type, firstAttachment.file_name)
                  return (
                    <div key={p.pin_id} onClick={() => handleJump(p)} className="flex items-start gap-3 p-3 rounded-xl hover:bg-[#f7f9fb] cursor-pointer">
                      <img src={p.message.sender.avatar_url || DEFAULT_AVATAR_URL} alt="" className="w-9 h-9 rounded-full object-cover shrink-0"/>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-semibold text-[#1a1c1e]">{p.message.sender.name}</p>
                        {isImg ? (
                          <div className="flex items-center gap-2 mt-1">
                            <img src={firstAttachment.file_url} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0"/>
                            {p.message.content && <p className="text-sm text-[#565f71] truncate">{p.message.content}</p>}
                          </div>
                        ) : firstAttachment ? (
                          <div className="flex items-center gap-2 mt-1">
                            <div className="w-8 h-8 rounded-lg bg-[#d7e3ff] flex items-center justify-center shrink-0">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                              </svg>
                            </div>
                            <p className="text-sm text-[#565f71] truncate">{firstAttachment.file_name}</p>
                          </div>
                        ) : (
                          <p className="text-sm text-[#565f71] truncate">{p.message.content}</p>
                        )}
                        <p className="text-[10px] text-[#70787d] mt-0.5">Ghim bởi {p.pinned_by.name}</p>
                      </div>
                      <button onClick={(e) => { e.stopPropagation(); unpin(p.message.id) }} className="text-xs text-[#ba1a1a] hover:underline shrink-0">Bỏ ghim</button>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

export default PinnedMessagesModal