import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import MembersPopup from './MembersPopup'
import AvatarPreviewModal from './AvatarPreviewModal'
import { uploadImageApi } from '../../api/upload.api'
import { useToast } from '../../hooks/useToast'
import type { ConversationDetail } from '../../hooks/useConversationDetail'
import { useConversationContext } from '../../contexts/ConversationContext'
import GroupAvatar from '../ui/GroupAvatar'

interface InfoHeaderProps {
  conversationId: string
  detail: ConversationDetail
  onSearchClick: () => void
  isAdmin: boolean
  currentUserId?: string
  onMemberRemoved?: () => void
}

function InfoHeader({ conversationId, detail, onSearchClick, isAdmin, currentUserId, onMemberRemoved }: InfoHeaderProps) {
  const [showMembers, setShowMembers] = useState(false)
  const [showAvatarModal, setShowAvatarModal] = useState(false)
  const navigate = useNavigate()
  const { updateConversation } = useConversationContext()
  const { showToast } = useToast()

  const chatType = detail.conversation?.type
  const otherUserId = detail.conversation?.other_user_id
  const canChangeAvatar = chatType === 'group' && isAdmin

  const handleViewProfile = () => {
    if (!otherUserId) return
    navigate(`/contacts?userId=${otherUserId}`)
  }

  const handleAvatarClick = () => {
    if (canChangeAvatar) setShowAvatarModal(true)
  }

  const handleConfirmAvatar = async (file: File | null, removeAvatar: boolean) => {
    try {
      const newAvatarUrl = removeAvatar
        ? null
        : file
          ? (await uploadImageApi(file)).url
          : null

      if (newAvatarUrl === null && !removeAvatar) return // không có gì để lưu, phòng vệ thêm

      await updateConversation(conversationId, { avatar_url: newAvatarUrl })
      await detail.refetch()
      showToast(removeAvatar ? 'Đã xoá ảnh nhóm' : 'Đã cập nhật ảnh nhóm', 'success')
      setShowAvatarModal(false)
    } catch {
      showToast('Không thể cập nhật ảnh nhóm', 'error')
      throw new Error('update failed')
    }
  }

  return (
    <>
      <div className="flex flex-col items-center py-6 border-b border-[#e6ebef]">
        <div className="relative mb-3">
          {chatType === 'group' ? (
            <GroupAvatar
              avatarUrl={detail.conversation?.avatar_url}
              memberAvatars={detail.members.map((m) => m.avatar_url)}
              size={80}
            />
          ) : (
            <img
              src={detail.displayAvatar}
              alt="avatar"
              className="w-20 h-20 rounded-full object-cover"
            />
          )}
          {canChangeAvatar && (
            <button
              onClick={handleAvatarClick}
              className="absolute bottom-0 right-0 w-6 h-6 rounded-full bg-[#2563eb] flex items-center justify-center cursor-pointer border-2 border-white"
            >
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
                <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
              </svg>
            </button>
          )}
        </div>
        <p className="text-base font-semibold text-[#1a1c1e]">{detail.displayName}</p>

        <div className="flex gap-4 mt-4">
          {chatType === "private" && (
            <button
              onClick={handleViewProfile}
              className="flex flex-col items-center gap-1"
            >
              <div className="w-9 h-9 rounded-full bg-[#f2f4f6] flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#565f71" strokeWidth="2">
                  <circle cx="12" cy="8" r="4" /><path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" />
                </svg>
              </div>
              <span className="text-xs text-[#565f71] whitespace-nowrap">Trang cá nhân</span>
            </button>
          )}

          {chatType === "group" && (
            <button onClick={() => setShowMembers(true)} className="flex flex-col items-center gap-1">
              <div className="w-9 h-9 rounded-full bg-[#f2f4f6] flex items-center justify-center">
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#565f71" strokeWidth="2">
                  <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
                  <circle cx="9" cy="7" r="4"/>
                  <path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/>
                </svg>
              </div>
              <span className="text-xs text-[#565f71]">Quản lý thành viên</span>
            </button>
          )}

          <button onClick={onSearchClick} className="flex flex-col items-center gap-1">
            <div className="w-9 h-9 rounded-full bg-[#f2f4f6] flex items-center justify-center">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#565f71" strokeWidth="2">
                <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
              </svg>
            </div>
            <span className="text-xs text-[#565f71]">Tìm kiếm</span>
          </button>
        </div>
      </div>

      {showAvatarModal && (
        <AvatarPreviewModal
          currentAvatarUrl={detail.conversation?.avatar_url}
          onConfirm={handleConfirmAvatar}
          onCancel={() => setShowAvatarModal(false)}
        />
      )}

      {showMembers && (
        <MembersPopup
          conversationId={conversationId}
          isAdmin={isAdmin}
          currentUserId={currentUserId}
          onClose={() => setShowMembers(false)}
          onMemberRemoved={onMemberRemoved}
        />
      )}
    </>
  )
}

export default InfoHeader