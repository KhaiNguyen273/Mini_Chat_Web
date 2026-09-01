import { useState, useEffect } from "react"
import { useFriendship } from "../../../hooks/useFriendship"
import { useBlock } from "../../../hooks/useBlock"
import { useToast } from "../../../hooks/useToast"
import { getUserByIdApi } from "../../../api/user.api"
import type { SearchedContact } from "../../../types/friendship.types"
import type { User } from "../../../types/user.types"
import { useNavigate } from 'react-router-dom'
import { DEFAULT_AVATAR_URL } from "../../../constants"
import { useConfirm } from "../../../hooks/useConfirm"
import { useContactSharedInfo } from "../../../hooks/useContactSharedInfo"
import MutualGroupsModal from "./MutualGroupsModal"
import SharedFilesModal from "./SharedFilesModal"
import { useConversationContext } from "../../../contexts/ConversationContext"
import { useNotification } from "../../../hooks/useNotification"
import { usePresenceContext } from "../../../contexts/PresenceContext"
import { formatLastSeen } from "../../../utils/formatLastSeen"
import GroupAvatar from "../../ui/GroupAvatar"

interface ContactWindowProps {
  contact: SearchedContact | null
  onUpdateContact: (id: string, patch: Partial<SearchedContact>) => void
}

function ContactWindow({ contact, onUpdateContact }: ContactWindowProps) {
  const confirm = useConfirm()
  const { sendRequest, acceptRequest, rejectRequest, unfriend } = useFriendship()
  const { blockedList, blockUser, unblockUser } = useBlock()
  const { showToast } = useToast()
  const [profile, setProfile] = useState<User | null>(null)
  const [loadingProfile, setLoadingProfile] = useState(false)
  const navigate = useNavigate()
  const { openPrivateConversation } = useConversationContext()
  const { notifications, markAsRead } = useNotification()
  const { isOnline, getLastSeen } = usePresenceContext()
  const online = isOnline(contact?.id)
  const lastSeen = !online ? getLastSeen(contact?.id) : null

  const { mutualGroups, allFiles, photosVideos, loading: loadingShared } = useContactSharedInfo(contact?.id)
  const [showGroupsModal, setShowGroupsModal] = useState(false)
  const [showFilesModal, setShowFilesModal] = useState(false)

  const PREVIEW_LIMIT = 3


  console.log("mutualGroups: ",mutualGroups);
  

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

  // dùng blockedList (từ /users/blocked) làm nguồn sự thật cho chiều "mình chặn họ" —
  // không dùng contact.relation vì field đó vốn tính cho friendship, chưa chắc phản ánh đúng blocked_users
  const iBlockedThem = blockedList.some((b) => b.user_id == contact.id)

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
      const noti = notifications.find(
        (n) => n.reference_type === 'friendship' && n.reference_id == contact.friendship_id && !n.is_read
      )
      if (noti) markAsRead(noti.id)
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
      const noti = notifications.find(
        (n) => n.reference_type === 'friendship' && n.reference_id === contact.friendship_id && !n.is_read
      )
      if (noti) markAsRead(noti.id)
      showToast('Đã từ chối lời mời', 'info')
    } catch {
      showToast('Có lỗi xảy ra, vui lòng thử lại', 'error')
    }
  }

  const handleUnfriend = async () => {
    if (!contact.friendship_id) return
    const ok = await confirm({
      title: 'Huỷ kết bạn',
      message: `Xác nhận huỷ kết bạn với ${contact.name} ?`,
      confirmText: 'Xác nhận',
      danger: true,
    })
    if (!ok) return
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

  const handleBlock = async () => {
    const ok = await confirm({
      title: 'Chặn người dùng',
      message: `Xác nhận chặn ${contact.name} ? Người này sẽ không thể nhắn tin cho bạn nữa.`,
      confirmText: 'Xác nhận',
      danger: true,
    })
    if (!ok) return
    try {
      await blockUser(contact.id)
      showToast('Đã chặn người dùng', 'info')
    } catch {
      showToast('Không thể chặn, vui lòng thử lại', 'error')
    }
  }

  const handleUnblock = async () => {
    const ok = await confirm({
      title: 'Bỏ chặn người dùng',
      message: `Bỏ chặn ${contact.name}? Người này sẽ có thể nhắn tin cho bạn trở lại.`,
      confirmText: 'Bỏ chặn',
    })
    if (!ok) return
    try {
      await unblockUser(contact.id)
      showToast('Đã bỏ chặn', 'info')
    } catch {
      showToast('Không thể bỏ chặn, vui lòng thử lại', 'error')
    }
  }

  const handleMessage = async () => {
    try {
      const conv = await openPrivateConversation(contact.id)
      navigate(`/chat/${conv.id}`)
    } catch (err: any) {
      showToast(err.response?.data?.message || 'Không thể mở đoạn chat', 'error')
    }
  }

  return (
    <div className="flex flex-col flex-1 h-full bg-[#f7f9fb] overflow-y-auto">

      <div className="flex flex-col items-center px-6 py-8 bg-white border-b border-[#e6ebef]">
        <div className="relative mb-3">
          <img src={contact.avatar_url || DEFAULT_AVATAR_URL} alt={contact.name} className="w-20 h-20 rounded-full object-cover mb-3"/>
          {online && (
            <span className="absolute bottom-2 right-1 w-4 h-4 bg-[#31a24c] rounded-full border-2 border-white"/>
          )}
        </div>
        <p className="text-base font-bold text-[#1a1c1e]">{contact.name}</p>
        {online && <p className="text-xs text-[#31a24c] mt-0.5">Đang hoạt động</p>}
        {lastSeen && <p className="text-xs text-[#70787d] mt-0.5">{formatLastSeen(lastSeen)}</p>}

        {loadingProfile ? (
          <p className="text-xs text-[#70787d] text-center mt-1">Đang tải...</p>
        ) : profile?.bio ? (
          <p className="text-xs text-[#565f71] text-center mt-1">{profile.bio}</p>
        ) : null}

        <div className="flex gap-3 mt-4">
          {!iBlockedThem && (
            <button onClick={handleMessage} className="flex items-center gap-2 px-4 py-2 rounded-full bg-[#2563eb] text-white text-sm font-semibold hover:opacity-90 transition-opacity">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="white">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>
              </svg>
              Nhắn tin
            </button>
          )}

          {!iBlockedThem && contact.relation === 'none' && (
            <button onClick={handleSendRequest} className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#70787d] text-[#565f71] text-sm font-semibold hover:bg-[#f2f4f6] transition-colors">
              Kết bạn
            </button>
          )}

          {!iBlockedThem && contact.relation === 'pending_sent' && (
            <button onClick={handleCancelRequest} className="px-4 py-2 rounded-full border border-[#70787d] text-[#565f71] text-sm font-semibold hover:bg-[#f2f4f6] transition-colors">
              Huỷ lời mời
            </button>
          )}

          {!iBlockedThem && contact.relation === 'pending_received' && (
            <div className="flex gap-2">
              <button onClick={handleAccept} className="px-4 py-2 rounded-full bg-[#2563eb] text-white text-sm font-semibold hover:opacity-90 transition-opacity">
                Chấp nhận
              </button>
              <button onClick={handleReject} className="px-4 py-2 rounded-full border border-[#70787d] text-[#565f71] text-sm font-semibold hover:bg-[#f2f4f6] transition-colors">
                Từ chối 
              </button>
            </div>
          )}

          {!iBlockedThem && contact.relation === 'friend' && (
            <button onClick={handleUnfriend} className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#ba1a1a] text-[#ba1a1a] text-sm font-semibold hover:bg-[#fff0f0] transition-colors">
              Huỷ kết bạn
            </button>
          )}

          {iBlockedThem ? (
            <button onClick={handleUnblock} className="flex items-center gap-2 px-4 py-2 rounded-full border border-[#70787d] text-[#565f71] text-sm font-semibold hover:bg-[#f2f4f6] transition-colors">
              Bỏ chặn
            </button>
          ) : (
            <button onClick={handleBlock} className="px-4 py-2 rounded-full border border-[#ba1a1a] text-[#ba1a1a] text-sm font-semibold hover:bg-[#fff0f0] transition-colors">
              Chặn
            </button>
          )}
        </div>
      </div>

      {/* Nhóm chung & File — data thật */}
      <div className="grid grid-cols-2 gap-3 p-6 border-b border-[#e6ebef]">

        <div className="bg-white rounded-xl p-3 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-[#565f71] uppercase tracking-wide">Nhóm chung</span>
            {mutualGroups.length > PREVIEW_LIMIT && (
              <span onClick={() => setShowGroupsModal(true)} className="text-xs text-[#2563eb] cursor-pointer hover:underline">
                Xem tất cả
              </span>
            )}
          </div>
          {loadingShared ? (
            <p className="text-xs text-[#565f71]">Đang tải...</p>
          ) : mutualGroups.length === 0 ? (
            <p className="text-xs text-[#565f71]">Không có nhóm chung</p>
          ) : (
            <div className="flex flex-col gap-2">
              {mutualGroups.slice(0, PREVIEW_LIMIT).map((g) => (
                <div key={g.id} onClick={() => navigate(`/chat/${g.id}`)} className="flex items-center gap-2 cursor-pointer hover:opacity-80">
                  <GroupAvatar avatarUrl={g.avatar_url} memberAvatars={g.member_avatars} size={28} className="shrink-0" />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-[#1a1c1e] truncate">{g.name}</p>
                    <p className="text-xs text-[#565f71]">{g.member_count} thành viên</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Tệp đã chia sẻ — GỒM CẢ ảnh/video/file, không phân biệt loại */}
        <div className="bg-white rounded-xl p-3 shadow-sm">
          <div className="flex justify-between items-center mb-2">
            <span className="text-xs font-semibold text-[#565f71] uppercase tracking-wide">Tệp đã chia sẻ</span>
            {allFiles.length > PREVIEW_LIMIT && (
              <span onClick={() => setShowFilesModal(true)} className="text-xs text-[#2563eb] cursor-pointer hover:underline">
                Xem tất cả
              </span>
            )}
          </div>
          {loadingShared ? (
            <p className="text-xs text-[#565f71]">Đang tải...</p>
          ) : allFiles.length === 0 ? (
            <p className="text-xs text-[#565f71]">Chưa có tệp nào</p>
          ) : (
            <div className="flex flex-col gap-2">
              {allFiles.slice(0, PREVIEW_LIMIT).map((f) => (
                <a key={f.id} href={f.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:opacity-80">
                  <div className="w-7 h-7 rounded-lg bg-[#d7e3ff] flex items-center justify-center shrink-0">
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                      <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                    </svg>
                  </div>
                  <p className="text-xs font-semibold text-[#1a1c1e] truncate">{f.file_name}</p>
                </a>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="p-6">
        <p className="text-xs font-semibold text-[#565f71] uppercase tracking-wide mb-3">Ảnh & Video gần đây</p>
        {photosVideos.length === 0 ? (
          <p className="text-xs text-[#565f71]">Chưa có ảnh/video nào</p>
        ) : (
          <div className="grid grid-cols-3 gap-2">
            {photosVideos.slice(0, PREVIEW_LIMIT).map((m, i) => {
              const isLastVisible = i === PREVIEW_LIMIT - 1
              const remaining = photosVideos.length - PREVIEW_LIMIT
              const showOverlay = isLastVisible && remaining > 0

              return (
                <a
                  key={m.id}
                  href={showOverlay ? undefined : m.file_url}
                  onClick={showOverlay ? (e) => { e.preventDefault(); setShowFilesModal(true) } : undefined}
                  target={showOverlay ? undefined : '_blank'}
                  rel="noopener noreferrer"
                  className="relative"
                >
                  {m.category === 'image' ? (
                    <img src={m.file_url} className="w-full aspect-square rounded-lg object-cover"/>
                  ) : (
                    <div className="w-full aspect-square rounded-lg bg-[#1a1c1e] flex items-center justify-center">
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
                    </div>
                  )}
                  {showOverlay && (
                    <div className="absolute inset-0 bg-black/50 rounded-lg flex items-center justify-center cursor-pointer">
                      <span className="text-white text-sm font-semibold">+{remaining}</span>
                    </div>
                  )}
                </a>
              )
            })}
          </div>
        )}  
      </div>

      {showGroupsModal && <MutualGroupsModal groups={mutualGroups} onClose={() => setShowGroupsModal(false)} />}
      {showFilesModal && <SharedFilesModal files={allFiles} onClose={() => setShowFilesModal(false)} />}

    </div>
  )
}

export default ContactWindow