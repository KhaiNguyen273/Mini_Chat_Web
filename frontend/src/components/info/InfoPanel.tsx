import InfoHeader from './InfoHeader'
import InfoSection from './InfoSection'
import type { ConversationDetail } from '../../hooks/useConversationDetail'

interface InfoPanelProps {
  conversationId: string
  detail: ConversationDetail
}

function InfoPanel({ conversationId, detail }: InfoPanelProps) {
  return (
    <div className="flex flex-col w-72 shrink-0 h-full bg-white border-l border-[#e6ebef] overflow-y-auto">
      <InfoHeader conversationId={conversationId} detail={detail} />

      <InfoSection title="Thông tin về đoạn chat" />
      <InfoSection title="Tuỳ chỉnh đoạn chat" />

      <InfoSection title="File phương tiện và file">
        <div className="flex gap-2 px-4 pb-3 flex-wrap">
          <img src="https://picsum.photos/60?random=1" className="w-16 h-16 rounded-lg object-cover"/>
          <img src="https://picsum.photos/60?random=2" className="w-16 h-16 rounded-lg object-cover"/>
          <div className="w-16 h-16 rounded-lg bg-[#ecf0f3] flex items-center justify-center text-sm font-semibold text-[#565f71]">
            +12
          </div>
        </div>
      </InfoSection>

      <InfoSection title="Quyền riêng tư và hỗ trợ">
        <div className="px-4 pb-3">
          <p className="text-sm text-[#ba1a1a] font-medium cursor-pointer hover:underline">Chặn người dùng</p>
        </div>
      </InfoSection>
    </div>
  )
}

export default InfoPanel