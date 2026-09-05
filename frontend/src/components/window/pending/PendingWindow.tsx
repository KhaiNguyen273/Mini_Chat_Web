import { useMessage } from '../../../hooks/useMessage'
import MessageItem from '../chat/MessageItem'
import type { Conversation } from '../../../types/conversation.types'
import { DEFAULT_AVATAR_URL } from '../../../constants'

interface PendingWindowProps {
  conversation: Conversation | null
  onAccept: (id: string) => void
  onReject: (id: string) => void
  onBack?: () => void
}

function PendingWindow({ conversation, onAccept, onReject, onBack }: PendingWindowProps) {
  const { messages, loading } = useMessage(conversation?.id)

  if (!conversation) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-[#565f71]">
        Chọn một yêu cầu để xem chi tiết
      </div>
    )
  }

  const avatar = conversation.avatar_url || DEFAULT_AVATAR_URL

  return (
    <div className="flex flex-col flex-1 h-full bg-[#f7f9fb]">

      <div className="flex items-center gap-2 px-4 py-3 bg-white border-b border-[#e6ebef] min-h-[60px]">
        {onBack && (
          <button onClick={onBack} className="w-8 h-8 rounded-full hover:bg-[#f2f4f6] flex items-center justify-center shrink-0 md:hidden">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a1c1e" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          </button>
        )}
        <img src={avatar} alt={conversation.name} className="w-10 h-10 rounded-full object-cover"/>
        <p className="text-sm font-semibold text-[#1a1c1e]">{conversation.name}</p>
      </div>


      <div className="flex-1 overflow-y-auto px-6 py-6 flex flex-col gap-4">
        <div className="flex justify-center">
          <div className="bg-white rounded-2xl shadow-sm p-6 flex flex-col items-center gap-2 w-72">
            <img src={avatar} alt={conversation.name} className="w-20 h-20 rounded-full object-cover"/>
            <p className="text-base font-bold text-[#1a1c1e]">{conversation.name}</p>
          </div>
        </div>

        {loading ? (
          <p className="text-xs text-center text-[#565f71]">Đang tải...</p>
        ) : (
          messages.map((msg) => (
            <MessageItem
              key={msg.id}
              id={msg.id}
              content={msg.content}
              isMine={false}
              attachments={msg.attachments}
            />
          ))
        )}

        <p className="text-xs text-center text-[#2563eb]">
          Người này không có trong danh bạ của bạn
        </p>
      </div>

      <div className="bg-white border-t border-[#e6ebef] px-6 py-4">
        <p className="text-xs text-center text-[#565f71] mb-3">
          Người này sẽ <span className="font-semibold text-[#1a1c1e]">không biết</span> bạn đã xem tin nhắn cho đến khi bạn chọn{' '}
          <span className="font-bold text-[#1a1c1e]">Chấp nhận</span>.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => onReject(conversation.id)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#ba1a1a] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Từ chối
          </button>
          <button
            onClick={() => onAccept(conversation.id)}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[#2563eb] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Chấp nhận
          </button>
        </div>
      </div>

    </div>
  )
}

export default PendingWindow