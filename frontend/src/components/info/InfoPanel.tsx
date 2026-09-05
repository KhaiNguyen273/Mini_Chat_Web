import { useState, useEffect } from 'react'
import { useAuth } from '../../hooks/useAuth'
import { useToast } from '../../hooks/useToast'
import { useNavigate } from 'react-router-dom'
import InfoHeader from './InfoHeader'
import InfoSection from './InfoSection'
import MediaFilePanel from './MediaFilePanel'
import type { ConversationDetail } from '../../hooks/useConversationDetail'
import PinIcon from '../ui/PinIcon'
import MessageSearchPanel from './MessageSearchPanel'
import { getMediaListApi } from '../../api/media.api'
import type { MediaItem } from '../../types/media.types'
import { useConversationContext } from '../../contexts/ConversationContext'
import { useConfirm } from '../../hooks/useConfirm'
import AssignAdminModal from './AssignAdminModal'
import { getSocket } from '../../socket/socketClient'
import PinnedMessagesModal from './PinnedMessagesModal'

interface InfoPanelProps {
  conversationId: string
  detail: ConversationDetail
  isBlocked: boolean
  onToggleBlock: () => void
  onJumpToMessage: (messageId: string, createdAt: string) => void
  onClose?: () => void
}

function InfoPanel({ conversationId, detail, isBlocked, onToggleBlock, onJumpToMessage, onClose }: InfoPanelProps) {
  const { user } = useAuth()
  const [showAssignAdmin, setShowAssignAdmin] = useState(false)
  const { toggleMute, updateConversation, removeMember, removeConversationLocally, conversations } = useConversationContext()
  const confirm = useConfirm()
  const { showToast } = useToast()
  const navigate = useNavigate()

  const [showPins, setShowPins] = useState(false)
  const [view, setView] = useState<'main' | 'media' | 'search'>('main')
  const [renaming, setRenaming] = useState(false)
  const [newName, setNewName] = useState(detail.conversation?.name || '')

  const self = detail.members.find((m) => String(m.id) === String(user?.id))
  const isAdmin = self?.role === 'admin'
  const isGroup = detail.conversation?.type === 'group'
  const [muted, setMuted] = useState<boolean>(false)

  // đồng bộ lại muted mỗi khi members load xong / đổi sang conversation khác —
  // tránh giữ state cũ từ lần render trước khi component bị tái sử dụng thay vì mount lại
  useEffect(() => {
    setMuted(!!self?.is_muted)
  }, [self?.is_muted, conversationId])

  // đồng bộ lại tên nhóm khi đổi conversation
  useEffect(() => {
    setNewName(detail.conversation?.name || '')
    setRenaming(false)
  }, [conversationId, detail.conversation?.name])

  const [previewMedia, setPreviewMedia] = useState<MediaItem[]>([])
  const [loadingPreview, setLoadingPreview] = useState(false)
  const PREVIEW_LIMIT = 3

  useEffect(() => {
    setLoadingPreview(true)
    getMediaListApi(conversationId)
      .then(setPreviewMedia)
      .finally(() => setLoadingPreview(false))
  }, [conversationId])

  useEffect(() => {
    setLoadingPreview(true)
    getMediaListApi(conversationId)
      .then(setPreviewMedia)
      .finally(() => setLoadingPreview(false))
  }, [conversationId])

  // MỚI — tin đính kèm bị thu hồi — refetch preview
  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    const handleMediaChanged = ({ conversationId: cid }: { conversationId: number }) => {
      if (String(cid) !== conversationId) return
      getMediaListApi(conversationId).then(setPreviewMedia)
    }

    socket.on('conversation:media-changed', handleMediaChanged)
    return () => { socket.off('conversation:media-changed', handleMediaChanged) }
  }, [conversationId])


  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    const refetchPreview = () => getMediaListApi(conversationId).then(setPreviewMedia)

    const handleDeleted = ({ conversationId: cid }: { conversationId: number }) => {
      if (String(cid) !== conversationId) return
      refetchPreview()
    }
    const handleNewMessage = (msg: any) => {
      if (String(msg.conversation_id) !== conversationId) return
      if (!msg.attachments || msg.attachments.length === 0) return
      refetchPreview()
    }

    socket.on('message:deleted', handleDeleted)
    socket.on('message:new', handleNewMessage)
    return () => {
      socket.off('message:deleted', handleDeleted)
      socket.off('message:new', handleNewMessage)
    }
  }, [conversationId])

  if (view === 'media') return <MediaFilePanel conversationId={conversationId} onBack={() => setView('main')} />
  if (view === 'search') return <MessageSearchPanel conversationId={conversationId} onBack={() => setView('main')} onJumpToMessage={onJumpToMessage} />

  const handleToggleMute = async () => {
    const next = !muted
    setMuted(next) // optimistic update — phản hồi ngay, không đợi API
    try {
      await toggleMute(conversationId, next)
    } catch {
      setMuted(!next) // rollback nếu lỗi
      showToast('Không thể cập nhật, vui lòng thử lại', 'error')
    }
  }

  const handleRename = async () => {
    if (!newName.trim()) return
    try {
      await updateConversation(conversationId, { name: newName.trim() })
      setRenaming(false)
      await detail.refetch() // báo useConversationDetail load lại — tên mới hiện ngay
      showToast('Đã đổi tên nhóm', 'success')
    } catch {
      showToast('Không thể đổi tên nhóm', 'error')
    }
  }

  const doLeaveGroup = async (newAdminId?: string) => {
    if (!user) return
    try {
      await removeMember(conversationId, user.id, newAdminId)
      const remaining = conversations.filter((c) => String(c.id) !== String(conversationId))
      removeConversationLocally(conversationId)
      showToast('Đã rời khỏi nhóm', 'info')
      setShowAssignAdmin(false)
      if (remaining.length > 0) {
        navigate(`/chat/${remaining[0].id}`, { replace: true })
      } else {
        navigate('/chat', { replace: true })
      }
    } catch (err: any) {
      if (err.response?.data?.message === 'MUST_ASSIGN_NEW_ADMIN') {
        await detail.refetch()
        setShowAssignAdmin(true)
      } else {
        showToast('Không thể rời nhóm', 'error')
      }
    }
  }

  const handleLeaveGroup = async () => {
    if (!user) return
    const ok = await confirm({
      title: 'Rời khỏi nhóm',
      message: 'Bạn có chắc muốn rời khỏi nhóm này?',
      confirmText: 'Rời nhóm',
      danger: true,
    })
    if (!ok) return
    await doLeaveGroup()
  }

  const remainingCount = previewMedia.length - PREVIEW_LIMIT

  

  return (
    <div className="flex flex-col w-full md:w-72 shrink-0 h-full bg-white border-l border-[#e6ebef] overflow-y-auto">
      {onClose && (
        <div className="flex items-center gap-2 px-4 py-3 border-b border-[#e6ebef] md:hidden">
          <button onClick={onClose} className="w-8 h-8 rounded-full hover:bg-[#f2f4f6] flex items-center justify-center">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#1a1c1e" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
          </button>
          <span className="text-sm font-semibold text-[#1a1c1e]">Thông tin đoạn chat</span>
        </div>
      )}
      <InfoHeader
        conversationId={conversationId}
        detail={detail}
        onSearchClick={() => setView('search')}
        isAdmin={isAdmin}
        currentUserId={user?.id}
        onMemberRemoved={() => detail.refetch()}
      />

      <InfoSection title="Thông tin về đoạn chat">
        <button onClick={() => setShowPins(true)} className="flex items-center gap-3 px-4 pb-3 w-full text-left">
          <PinIcon size={16} />
          <span className="text-sm text-[#1a1c1e]">Xem tin nhắn đã ghim</span>
          {detail.conversation && (detail.conversation as any).pinned_count > 0 && (
            <span className="text-xs text-[#70787d] ml-auto">{(detail.conversation as any).pinned_count}</span>
          )}
        </button>
      </InfoSection>

      <InfoSection title="Tuỳ chỉnh đoạn chat">
        <div className="px-4 pb-3 flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <span className="text-sm text-[#1a1c1e]">Tắt thông báo</span>
            <button
              onClick={handleToggleMute}
              className={`w-11 h-6 rounded-full relative transition-colors ${muted ? 'bg-[#70787d]' : 'bg-[#2563eb]'}`}
            >
              <div className={`w-5 h-5 bg-white rounded-full absolute top-0.5 shadow transition-all ${muted ? 'left-0.5' : 'right-0.5'}`}/>
            </button>
          </div>

          {isGroup && isAdmin && (
            renaming ? (
              <div className="flex gap-2">
                <input value={newName} onChange={(e) => setNewName(e.target.value)} autoFocus
                  className="flex-1 px-2 py-1.5 rounded-lg border border-[#70787d] text-xs outline-none focus:border-[#2563eb]"/>
                <button onClick={handleRename} className="px-2.5 py-1.5 rounded-lg bg-[#2563eb] text-white text-xs font-semibold">Lưu</button>
                <button onClick={() => setRenaming(false)} className="px-2.5 py-1.5 rounded-lg bg-[#f2f4f6] text-[#565f71] text-xs">Huỷ</button>
              </div>
            ) : (
              <button onClick={() => setRenaming(true)} className="text-xs text-[#2563eb] hover:underline text-left">
                Đổi tên nhóm
              </button>
            )
          )}
        </div>
      </InfoSection>

      <InfoSection title="File phương tiện và file">
        <div className="px-4 pb-3">
          {previewMedia.length > 3 && (
            <div className="flex justify-end mb-2">
              <button onClick={() => setView('media')} className="text-xs text-[#2563eb] hover:underline">
                Xem tất cả
              </button>
            </div>
          )}

          {loadingPreview ? (
            <p className="text-xs text-[#565f71]">Đang tải...</p>
          ) : previewMedia.length === 0 ? (
            <p className="text-xs text-[#565f71]">Chưa có file nào</p>
          ) : (
            <div className="grid grid-cols-3 gap-1.5">
              {previewMedia.slice(0, PREVIEW_LIMIT).map((m, i) => {
                const isLastVisible = i === PREVIEW_LIMIT - 1
                const showOverlay = isLastVisible && remainingCount > 0

                return (
                  <button
                    key={m.id}
                    onClick={() => setView('media')}
                    className="relative w-full aspect-square rounded-lg overflow-hidden"
                  >
                    {m.category === 'image' ? (
                      <img src={m.file_url} className="w-full h-full object-cover"/>
                    ) : m.category === 'video' ? (
                      <div className="w-full h-full bg-[#1a1c1e] flex items-center justify-center">
                        <svg width="18" height="18" viewBox="0 0 24 24" fill="white"><path d="M8 5v14l11-7z"/></svg>
                      </div>
                    ) : (
                      <div className="w-full h-full bg-[#d7e3ff] flex items-center justify-center">
                        <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2">
                          <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/>
                        </svg>
                      </div>
                    )}
                    {showOverlay && (
                      <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                        <span className="text-white text-sm font-semibold">+{remainingCount}</span>
                      </div>
                    )}
                  </button>
                )
              })}
            </div>
          )}
        </div>
      </InfoSection>

      <InfoSection title="Quyền riêng tư và hỗ trợ">
        <div className="px-4 pb-3 flex flex-col gap-2">
          {isGroup ? (
            <p onClick={handleLeaveGroup} className="text-sm text-[#ba1a1a] font-medium cursor-pointer hover:underline">
              Rời khỏi nhóm
            </p>
          ) : (
            <p onClick={onToggleBlock} className="text-sm text-[#ba1a1a] font-medium cursor-pointer hover:underline">
              {isBlocked ? 'Bỏ chặn người dùng' : 'Chặn người dùng'}
            </p>
          )}
        </div>
      </InfoSection>

      {showPins && (
        <PinnedMessagesModal conversationId={conversationId} onClose={() => setShowPins(false)} onJumpToMessage={onJumpToMessage} />
      )}

      {showAssignAdmin && (
        <AssignAdminModal
          candidates={detail.members.filter((m) => String(m.id) !== String(user?.id))}
          onSelect={(newAdminId) => doLeaveGroup(newAdminId)}
          onClose={() => setShowAssignAdmin(false)}
        />
      )}
    </div>
    
  )
}

export default InfoPanel