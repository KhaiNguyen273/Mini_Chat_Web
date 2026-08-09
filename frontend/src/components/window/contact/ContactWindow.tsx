import { useState, useEffect } from "react"
import { useFriendship } from "../../../hooks/useFriendship"
import { useToast } from "../../../hooks/useToast"
import { getUserByIdApi } from "../../../api/user.api"
import type { SearchedContact } from "../../../types/friendship.types"
import type { User } from "../../../types/user.types"
import { useNavigate } from 'react-router-dom'
import { useConversation } from '../../../hooks/useConversation'
import { DEFAULT_AVATAR_URL } from "../../../constants"

interface ContactWindowProps {
  contact: SearchedContact | null
  onUpdateContact: (id: string, patch: Partial<SearchedContact>) => void
}

function ContactWindow({ contact, onUpdateContact }: ContactWindowProps) {
  const { sendRequest, acceptRequest, rejectRequest, unfriend } = useFriendship()
  const { showToast } = useToast()
  const [profile, setProfile] = useState<User | null>(null) 
  const [loadingProfile, setLoadingProfile] = useState(false)
  const navigate = useNavigate()
  const { openPrivateConversation } = useConversation()

  useEffect(() => {
    if (!contact) {
      setProfile(null)
      return
    }
    setProfile(null)
    setLoadingProfile(true)
    getUserByIdApi(contact.id)
      .then(setProfile)
      .catch(() => setProfile(null))
      .finally(() => setLoadingProfile(false))
  }, [contact?.id])

  if (!contact) {
    return (
      <div className="flex flex-1 items-center justify-center text-sm text-[#565f71]">
        Tìm kiếm hoặc chọn một liên hệ để xem chi tiết
      </div>
    )
  }

  const handleSendRequest = async () => {
    try {
      const res = await sendRequest(contact.id)
      onUpdateContact(contact.id, { relation: 'pending_sent', friendship_id: res.id })
      showToast('Đã gửi lời mời kết bạn', 'success')
    } catch {
      showToast('Gửi lời mời thất bại, vui lòng thử lại', 'error')
    }
  }

  const handleAccept = async () => {
    if (!contact.friendship_id) return
    try {
      await acceptRequest(contact.friendship_id)
      onUpdateContact(contact.id, { relation: 'friend' })
      showToast('Đã chấp nhận lời mời kết bạn', 'success')
    } catch {
      showToast('Không thể chấp nhận lời mời', 'error')
    }
  }

  const handleReject = async () => {
    if (!contact.friendship_id) return
    try {
      await rejectRequest(contact.friendship_id)
      onUpdateContact(contact.id, { relation: 'none', friendship_id: null })
      showToast('Đã từ chối lời mời', 'info')
    } catch {
      showToast('Có lỗi xảy ra, vui lòng thử lại', 'error')
    }
  }

  const handleUnfriend = async () => {
    if (!contact.friendship_id) return
    try {
      await unfriend(contact.friendship_id)
      onUpdateContact(contact.id, { relation: 'none', friendship_id: null })
      showToast('Đã huỷ kết bạn', 'info')
    } catch {
      showToast('Không thể huỷ kết bạn, vui lòng thử lại', 'error')
    }
  }

  const handleCancelRequest = async () => {
    if (!contact.friendship_id) return
    try {
      await unfriend(contact.friendship_id)
      onUpdateContact(contact.id, { relation: 'none', friendship_id: null })
      showToast('Đã huỷ lời mời kết bạn', 'info')
    } catch {
      showToast('Không thể huỷ lời mời, vui lòng thử lại', 'error')
    }
  }

  const handleMessage = async () => {
  try {
    const conv = await openPrivateConversation(contact.id)
    navigate(`/chat/${conv.id}`)
  } catch {
    showToast('Không thể mở đoạn chat, vui lòng thử lại', 'error')
  }
}

  return (
    <div className="flex flex-col flex-1 h-full bg-[#f7f9fb] overflow-y-auto">

      {/* Avatar + Info */}
      <div className="flex flex-col items-center px-6 py-8 bg-white border-b border-[#e6ebef]">
        <div className="relative mb-3">
          <img src={contact.avatar_url||DEFAULT_AVATAR_URL} alt={contact.name} className="w-20 h-20 rounded-full object-cover mb-3"/>
        </div>
        <p className="text-base font-bold text-[#1a1c1e]">{contact.name}</p>

        {loadingProfile ? (
          <p className="text-xs text-[#70787d] text-center mt-1">Đang tải...</p>
        ) : profile?.bio ? (
          <p className="text-xs text-[#565f71] text-center mt-1">{profile.bio}</p>
        ) : null}

        <div className="flex gap-3 mt-4">
          <button 
          onClick={handleMessage}
          className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#2563eb] text-white text-sm font-semibold hover:opacity-90 transition-opacity">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
              <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
            </svg>
            Nhắn tin
          </button>

          {contact.relation === 'none' && (
            <button onClick={handleSendRequest} className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#70787d] text-[#565f71] text-sm font-semibold hover:bg-[#f2f4f6] transition-colors">
              Kết bạn
            </button>
          )}

          {contact.relation === 'pending_sent' && (
            <button
              onClick={handleCancelRequest}
              className="px-4 py-2 rounded-full border border-[#70787d] text-[#565f71] text-sm font-semibold hover:bg-[#f2f4f6] transition-colors"
            >
              Huỷ lời mời
            </button>
          )}

          {contact.relation === 'pending_received' && (
            <div className="flex gap-2">
              <button onClick={handleAccept} className="px-4 py-2 rounded-full bg-[#2563eb] text-white text-sm font-semibold hover:opacity-90 transition-opacity">
                Chấp nhận
              </button>
              <button onClick={handleReject} className="px-4 py-2 rounded-full border border-[#70787d] text-[#565f71] text-sm font-semibold hover:bg-[#f2f4f6] transition-colors">
                Từ chối
              </button>
            </div>
          )}

          {contact.relation === 'friend' && (
            <button onClick={handleUnfriend} className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#ba1a1a] text-[#ba1a1a] text-sm font-semibold hover:bg-[#fff0f0] transition-colors">
              Huỷ kết bạn
            </button>
          )}
        </div>
      </div>

      {/* Nhóm chung & File — giữ nguyên phần tĩnh, chưa có API */}
      <div className="grid grid-cols-2 gap-3 p-6 border-b border-[#e6ebef]">
        <div className="bg-white rounded-xl p-3 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-[#565f71] uppercase tracking-wide">Nhóm chung</span>
            <span className="text-xs text-[#2563eb] cursor-pointer hover:underline">Xem tất cả</span>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#2563eb] flex items-center justify-center text-white text-xs font-bold shrink-0">D</div>
              <div>
                <p className="text-xs font-semibold text-[#1a1c1e]">Design Syndicate</p>
                <p className="text-xs text-[#565f71]">12 thành viên</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#565f71] flex items-center justify-center text-white text-xs font-bold shrink-0">M</div>
              <div>
                <p className="text-xs font-semibold text-[#1a1c1e]">Marketing Team</p>
                <p className="text-xs text-[#565f71]">45 thành viên</p>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl p-3 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-[#565f71] uppercase tracking-wide">Tệp đã chia sẻ</span>
            <span className="text-xs text-[#2563eb] cursor-pointer hover:underline">Tải về hết</span>
          </div>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#d7e3ff] flex items-center justify-center shrink-0">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
                  <polyline points="14 2 14 8 20 8"/>
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-[#1a1c1e] truncate">Brand_Guidelines.pdf</p>
                <p className="text-xs text-[#565f71]">4.2 MB • 2 ngày trước</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-[#d7e3ff] flex items-center justify-center shrink-0">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                  <rect x="3" y="3" width="18" height="18" rx="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21 15 16 10 5 21"/>
                </svg>
              </div>
              <div>
                <p className="text-xs font-semibold text-[#1a1c1e] truncate">hero-section-final.png</p>
                <p className="text-xs text-[#565f71]">1.8 MB • Tuần trước</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        <p className="text-xs font-semibold text-[#565f71] uppercase tracking-wide mb-3">Ảnh & Video gần đây</p>
        <div className="grid grid-cols-3 gap-2">
          <img src="https://picsum.photos/80?random=1" className="w-full aspect-square rounded-lg object-cover"/>
          <img src="https://picsum.photos/80?random=2" className="w-full aspect-square rounded-lg object-cover"/>
          <div className="w-full aspect-square rounded-lg bg-[#ecf0f3] flex items-center justify-center text-sm font-semibold text-[#565f71] cursor-pointer hover:bg-[#e6ebef] transition-colors">
            +12
          </div>
        </div>
      </div>

    </div>
  )
}

export default ContactWindow