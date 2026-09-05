// src/components/info/AvatarPreviewModal.tsx
import { useState, useRef } from 'react'
import { useConfirm } from '../../hooks/useConfirm'
import { DEFAULT_AVATAR_URL } from '../../constants'

interface AvatarPreviewModalProps {
  currentAvatarUrl?: string
  onConfirm: (file: File | null, removeAvatar: boolean) => Promise<void>
  onCancel: () => void
}

function AvatarPreviewModal({ currentAvatarUrl, onConfirm, onCancel }: AvatarPreviewModalProps) {
  const [saving, setSaving] = useState(false)
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [removeAvatar, setRemoveAvatar] = useState(false)
  const confirm = useConfirm()
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handlePickImage = () => {
    fileInputRef.current?.click()
  }

  const handleFileSelected = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPendingFile(file)
    setPreviewUrl(URL.createObjectURL(file))
    setRemoveAvatar(false)
  }

  const handleRemoveClick = async () => {
    const ok = await confirm({
      title: 'Xoá ảnh nhóm',
      message: 'Dùng ảnh mặc định thay cho ảnh hiện tại?',
      confirmText: 'Xoá ảnh',
      danger: true,
    })
    if (!ok) return
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPendingFile(null)
    setPreviewUrl(null)
    setRemoveAvatar(true)
  }

  const handleConfirm = async () => {
    setSaving(true)
    try {
      await onConfirm(pendingFile, removeAvatar)
    } finally {
      setSaving(false)
    }
  }

  // ưu tiên: đã chọn ảnh mới > đã bấm xoá > giữ nguyên ảnh hiện tại
  const newImageSrc = removeAvatar
    ? DEFAULT_AVATAR_URL
    : previewUrl || currentAvatarUrl || DEFAULT_AVATAR_URL

  const hasSomethingToRemove = !removeAvatar && !!(previewUrl || currentAvatarUrl)

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-[70]" onClick={saving ? undefined : onCancel} />
      <div className="fixed inset-0 z-[71] flex items-center justify-center pointer-events-none">
        <div className="bg-white rounded-2xl shadow-xl 	w-[calc(100vw-2rem)] max-w-[360px] flex flex-col pointer-events-auto">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#e6ebef]">
            <div className="w-7" />
            <h2 className="text-base font-bold text-[#1a1c1e]">Đổi ảnh nhóm</h2>
            <button
              onClick={onCancel}
              disabled={saving}
              className="w-7 h-7 rounded-full bg-[#f2f4f6] hover:bg-[#e6ebef] flex items-center justify-center disabled:opacity-50"
            >
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#565f71" strokeWidth="2.5">
                <path d="M18 6 6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={handleFileSelected}
          />

          <div className="flex flex-col items-center gap-4 px-6 py-8">
            <div className="flex items-center gap-6">
              <div className="flex flex-col items-center gap-2">
                <img src={currentAvatarUrl || DEFAULT_AVATAR_URL} alt="Ảnh hiện tại" className="w-20 h-20 rounded-full object-cover opacity-60" />
                <span className="text-xs text-[#70787d]">Hiện tại</span>
              </div>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#70787d" strokeWidth="2">
                <path d="M5 12h14M12 5l7 7-7 7" />
              </svg>
              <div className="flex flex-col items-center gap-2">
                <div className="relative">
                  <img
                    src={newImageSrc}
                    alt="Ảnh mới"
                    className="w-20 h-20 rounded-full object-cover ring-2 ring-[#2563eb] ring-offset-2"
                  />
                  
                  {/* Nút Xóa ảnh (Nằm ở góc trên bên phải) */}
                  {hasSomethingToRemove && (
                    <button
                      onClick={handleRemoveClick}
                      disabled={saving}
                      title="Xoá ảnh"
                      className="absolute -top-1 -right-1 w-6 h-6 rounded-full bg-[#ba1a1a] flex items-center justify-center border-2 border-white disabled:opacity-50 hover:bg-red-700 transition-colors"
                    >
                      <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
                        <path d="M18 6 6 18M6 6l12 12" />
                      </svg>
                    </button>
                  )}

                  {/* Nút Chọn ảnh/Máy ảnh (Nằm ở góc dưới bên phải) */}
                  <button
                    onClick={handlePickImage}
                    disabled={saving}
                    title="Chọn ảnh"
                    className="absolute -bottom-1 -right-1 w-6 h-6 rounded-full bg-[#2563eb] flex items-center justify-center border-2 border-white disabled:opacity-50 hover:bg-blue-700 transition-colors"
                  >
                    <svg 
                      width="11" 
                      height="11" 
                      viewBox="-1.5 -1.5 27 27" 
                      fill="none" 
                      stroke="white" 
                      strokeWidth="2.5" 
                      strokeLinecap="round" 
                      strokeLinejoin="round"
                    >
                      <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z" />
                      <circle cx="12" cy="13" r="4" />
                    </svg>
                  </button>
                  
                </div>
                <span className="text-xs text-[#2563eb] font-medium">
                  {removeAvatar ? 'Ảnh mặc định' : previewUrl ? 'Ảnh mới' : 'Ảnh mới'}
                </span>
              </div>
            </div>
          </div>

          <div className="px-6 py-4 border-t border-[#e6ebef] flex gap-3">
            <button
              onClick={onCancel}
              disabled={saving}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-[#565f71] bg-[#f2f4f6] hover:bg-[#e6ebef] transition-colors disabled:opacity-50"
            >
              Huỷ
            </button>
            <button
              onClick={handleConfirm}
              disabled={saving || (!pendingFile && !removeAvatar)}
              className="flex-1 py-2.5 rounded-xl text-sm font-semibold text-white bg-[#2563eb] hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {saving ? 'Đang lưu...' : 'Lưu ảnh'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default AvatarPreviewModal