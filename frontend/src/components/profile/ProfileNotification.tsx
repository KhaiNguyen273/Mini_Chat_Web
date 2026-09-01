

import { useNavigate } from 'react-router-dom'
import { useFriendship } from '../../hooks/useFriendship'
import { useNotification } from '../../hooks/useNotification'
import ProfileHeader from './ProfileHeader'
import type { Notification } from '../../types/notification.types'
import { DEFAULT_AVATAR_URL } from '../../constants'
import { getMessageByIdApi } from '../../api/message.api'
import { useToast } from '../../hooks/useToast'

function formatTime(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const diffMin = Math.floor((now.getTime() - date.getTime()) / 60000)
  if (diffMin < 1) return 'Vừa xong'
  if (diffMin < 60) return `${diffMin} ph`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `${diffHour} giờ`
  const diffDay = Math.floor(diffHour / 24)
  return `${diffDay} ngày`
}

function notificationText(n: Notification): string {
  const MAX_PREVIEW_LENGTH = 40

  const truncate = (text: string) =>
    text.length > MAX_PREVIEW_LENGTH ? text.slice(0, MAX_PREVIEW_LENGTH) + '...' : text

  switch (n.type) {
    case 'friend_request':
      return `${n.actor?.name || 'Ai đó'} ${n.preview}`
    case 'friend_accepted':
      return `${n.actor?.name || 'Ai đó'} ${n.preview}`
    case 'pending_message':
      return `${n.actor?.name || 'Ai đó'} đã nhắn: ${truncate(n.preview)}`
    case 'new_message':
      return `${n.actor?.name || 'Ai đó'}: ${truncate(n.preview)}`
    default:
      return n.preview
  }
}

function ProfileNotification() {
  const navigate = useNavigate()
  const { requests, acceptRequest, rejectRequest, loading: friendLoading } = useFriendship()
  const { notifications, unreadCount, loading, markAsRead, markAllAsRead } = useNotification()
  const { showToast } = useToast()

  const handleNotificationClick = async (n: Notification) => {
    if (!n.is_read) markAsRead(n.id)

    switch (n.reference_type) {
      case 'message': {
        if (n.conversation_id) {
          navigate(`/chat/${n.conversation_id}?highlight=${n.reference_id}`)
          return
        }
        try {
          const msg = await getMessageByIdApi(n.reference_id)
          navigate(`/chat/${msg.conversation_id}?highlight=${n.reference_id}`)
        } catch {
          showToast("Tin nhắn đã bị xóa hoặc không tìm thấy", 'info')
        }
        break
      }
      case 'conversation':
        navigate('/pending')
        break
      case 'friendship':
        navigate('/contacts')
        break
    }
  }
  
  const handleAcceptRequest = async (friendshipId: string) => {
    await acceptRequest(friendshipId)
    const noti = notifications.find(
      (n) => n.reference_type === 'friendship' && n.reference_id == friendshipId && !n.is_read
    )
    if (noti) markAsRead(noti.id)
  }

  const handleRejectRequest = async (friendshipId: string) => {
    await rejectRequest(friendshipId)
    const noti = notifications.find(
      (n) => n.reference_type === 'friendship' && n.reference_id === friendshipId && !n.is_read
    )
    if (noti) markAsRead(noti.id)
  }

  return (
    <div className="flex flex-col flex-1 h-full bg-[#f7f9fb] overflow-y-auto">
      <ProfileHeader title="Thông báo" />

      <div className="max-w-2xl mx-auto w-full px-6 py-6 flex flex-col gap-6">

        {/* Lời mời kết bạn — vẫn dùng flow accept/reject riêng của friendship */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#1a1c1e]">Lời mời kết bạn</h3>
            {requests.length > 0 && (
              <span className="text-xs text-[#565f71]">{requests.length} lời mời</span>
            )}
          </div>

          {friendLoading ? (
            <p className="text-xs text-[#565f71]">Đang tải...</p>
          ) : requests.length === 0 ? (
            <p className="text-xs text-[#565f71]">Không có lời mời kết bạn nào</p>
          ) : (
            <div className="flex flex-col gap-3 max-h-80 overflow-y-auto pr-1">
              {requests.map(r => (
                <div key={r.id} className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#f7f9fb] transition-colors">
                  <img src={r.avatar_url || DEFAULT_AVATAR_URL} alt={r.name} className="w-11 h-11 rounded-full object-cover shrink-0"/>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-[#1a1c1e]">{r.name}</p>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    <button onClick={() => handleAcceptRequest(r.id)} className="px-3 py-1.5 rounded-lg bg-[#2563eb] text-white text-xs font-semibold hover:opacity-90 transition-opacity">
                      Chấp nhận
                    </button>
                    <button onClick={() => handleRejectRequest(r.id)} className="px-3 py-1.5 rounded-lg bg-[#f2f4f6] text-[#565f71] text-xs font-semibold hover:bg-[#e6ebef] transition-colors">
                      Từ chối
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Thông báo chung — giới hạn khung ~5 dòng, cuộn bên trong nếu nhiều hơn */}
        <div className="bg-white rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-[#1a1c1e]">Thông báo</h3>
            {unreadCount > 0 && (
              <span onClick={markAllAsRead} className="text-xs text-[#2563eb] cursor-pointer hover:underline">
                Đánh dấu tất cả đã đọc
              </span>
            )}
          </div>

          {loading ? (
            <p className="text-xs text-[#565f71]">Đang tải...</p>
          ) : notifications.length === 0 ? (
            <p className="text-xs text-[#565f71]">Không có thông báo nào</p>
          ) : (
            <div className="flex flex-col gap-1 max-h-[345px] overflow-y-auto pr-1">
              {notifications.map(n => (
                <div
                  key={n.id}
                  onClick={() => handleNotificationClick(n)}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer hover:bg-[#f7f9fb] transition-colors shrink-0 ${!n.is_read ? 'bg-[#f0f5ff]' : ''}`}
                >
                  <img src={n.actor?.avatar_url || DEFAULT_AVATAR_URL} alt={n.actor?.name} className="w-11 h-11 rounded-full object-cover shrink-0"/>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-[#1a1c1e] truncate">
                      {notificationText(n)}
                    </p>
                    <p className="text-xs text-[#70787d] mt-0.5">{formatTime(n.created_at)}</p>
                  </div>
                  {!n.is_read && <span className="w-2 h-2 rounded-full bg-[#2563eb] shrink-0"/>}
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}

export default ProfileNotification