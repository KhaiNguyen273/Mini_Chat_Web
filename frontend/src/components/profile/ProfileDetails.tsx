import { useState, useRef, useEffect } from 'react'
import ProfileHeader from './ProfileHeader'
import { useUser } from '../../hooks/useUser'
import { useToast } from '../../hooks/useToast'
import { DEFAULT_AVATAR_URL } from '../../constants'
import { uploadImageApi } from '../../api/upload.api'
import { useConfirm } from '../../hooks/useConfirm'
import { useAuth } from '../../hooks/useAuth'
import { useNavigate } from 'react-router-dom'

function ProfileDetails() {
  const { showToast } = useToast()
  const { user, updateProfile, deleteAccount, loading } = useUser()
  const { logout } = useAuth()
  const navigate = useNavigate()
  const confirm = useConfirm()
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(user?.name || '')
  const [bio, setBio] = useState(user?.bio || '')
  const [avatar_url, setAvatar] = useState(user?.avatar_url || '')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const maxBio = 160
  const [removeAvatar, setRemoveAvatar] = useState(false)


  // ảnh mới đã chọn nhưng CHƯA lưu — chỉ preview cục bộ, không gọi API nào
  const [pendingFile, setPendingFile] = useState<File | null>(null)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)

  useEffect(() => {
    if (user) {
      setName(user.name)
      setBio(user.bio || '')
      setAvatar(user?.avatar_url || '')
    }
  }, [user])

  const handleRemoveAvatar = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPendingFile(null)
    setPreviewUrl(null)
    setRemoveAvatar(true)
  }

  const handleCancel = () => {
    setName(user?.name || '')
    setBio(user?.bio || '')
    setAvatar(user?.avatar_url || '')
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPendingFile(null)
    setPreviewUrl(null)
    setRemoveAvatar(false)
    setIsEditing(false)
  }

  const handleSave = async () => {
    try {
      let finalAvatarUrl: string | null = avatar_url

      if (pendingFile) {
        setUploadingAvatar(true)
        const uploaded = await uploadImageApi(pendingFile)
        finalAvatarUrl = uploaded.url
        setUploadingAvatar(false)
      } else if (removeAvatar) {
        finalAvatarUrl = null
      }

      await updateProfile({ name, bio, avatar_url: finalAvatarUrl })
      setIsEditing(false)
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setPendingFile(null)
      setPreviewUrl(null)
      setRemoveAvatar(false)
      showToast("Lưu thay đổi thành công","success")
    } catch {
      setUploadingAvatar(false)
      showToast("Lưu thay đổi thất bại","error")
    }
  }

  // chỉ chọn file + tạo preview cục bộ — KHÔNG upload, KHÔNG gọi API nào
  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    if (previewUrl) URL.revokeObjectURL(previewUrl)
    setPendingFile(file)
    setPreviewUrl(URL.createObjectURL(file))
  }

  const handleDeleteAccount = async () => {
    const ok = await confirm({
      title: 'Vô hiệu hoá tài khoản',
      message: 'Bạn chắc chắn muốn vô hiệu hoá tài khoản? Hành động này không thể hoàn tác.',
      confirmText: 'Vô hiệu hoá',
      danger: true,
    })
    if (!ok) return
    try {
      await deleteAccount()
      await logout() // MỚI — dọn sạch accessToken + socket + user
      navigate('/login', { replace: true })
      showToast('Đã vô hiệu hóa tài khoản', 'success')
    } catch {
      showToast('Vô hiệu hóa tài khoản thất bại', 'error')
    }
  }

  const displayedAvatar = removeAvatar ? DEFAULT_AVATAR_URL : (previewUrl || avatar_url || DEFAULT_AVATAR_URL)

  return (
    <div className="flex flex-col flex-1 h-full bg-[#f7f9fb] overflow-y-auto">
      <ProfileHeader title="Chi tiết tài khoản">
        {isEditing ? (
          <div className="flex items-center gap-3">
            <button
              onClick={handleCancel}
              disabled={loading || uploadingAvatar}
              className="text-sm text-[#565f71] hover:text-[#1a1c1e] transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              disabled={loading || uploadingAvatar}
              className="px-4 py-2 rounded-xl bg-[#2563eb] text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {loading || uploadingAvatar ? 'Đang lưu...' : 'Lưu thay đổi'}
            </button>
          </div>
        ) : (
          <button
            onClick={() => setIsEditing(true)}
            className="px-4 py-2 rounded-xl border border-[#70787d] text-sm text-[#565f71] font-semibold hover:bg-[#f2f4f6] transition-colors"
          >
            Thay đổi
          </button>
        )}
      </ProfileHeader>

      <div className="max-w-2xl mx-auto w-full px-6 py-6 flex flex-col gap-6">

        <div className="bg-white rounded-2xl px-6 py-2 flex items-center gap-5 shadow-sm">
          <img
            src={displayedAvatar}
            alt="avatar"
            className="w-20 h-20 rounded-xl object-cover"
          />
          <div>
            <p className="text-base font-bold text-[#1a1c1e] mb-1">Ảnh đại diện</p>
            <p className="text-xs text-[#565f71] mb-3">Chất lượng ảnh PNG or JPG, max 5MB.</p>
            {isEditing && (
              <div className="flex gap-2">
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg"
                  className="hidden"
                  onChange={handleAvatarChange}
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={loading || uploadingAvatar}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#70787d] text-sm text-[#565f71] hover:bg-[#f2f4f6] transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#565f71" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  Đổi ảnh đại diện
                </button>
                {(avatar_url && !removeAvatar) || previewUrl ? (
                  <button
                    onClick={handleRemoveAvatar}
                    disabled={loading || uploadingAvatar}
                    className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#ba1a1a] text-sm text-[#ba1a1a] hover:bg-[#fff0f0] transition-colors"
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#ba1a1a" strokeWidth="2">
                      <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2m3 0v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6h14z"/>
                    </svg>
                    Xoá ảnh
                  </button>
                ) : null}
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col gap-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-[#2563eb] mb-1">Tên hiển thị</label>
              <input
                type="text"
                value={name}
                onChange={e => setName(e.target.value)}
                disabled={!isEditing}
                className="w-full px-3 py-2.5 rounded-lg border border-[#70787d] text-sm text-[#1a1c1e] outline-none focus:border-[#2563eb] disabled:bg-[#f7f9fb] disabled:text-[#565f71] transition-colors"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#2563eb] mb-1">Số điện thoại</label>
              <input
                type="tel"
                value={user?.phone || ''}
                disabled
                className="w-full px-3 py-2.5 rounded-lg border border-[#70787d] text-sm text-[#1a1c1e] outline-none disabled:bg-[#f7f9fb] disabled:text-[#565f71] transition-colors"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#2563eb] mb-1">Giới thiệu bản thân</label>
            <textarea
              value={bio}
              onChange={e => setBio(e.target.value.slice(0, maxBio))}
              disabled={!isEditing}
              rows={3}
              className="w-full px-3 py-2.5 rounded-lg border border-[#70787d] text-sm text-[#1a1c1e] outline-none focus:border-[#2563eb] resize-none disabled:bg-[#f7f9fb] disabled:text-[#565f71] transition-colors"
            />
            <p className="text-xs text-[#70787d] text-right mt-1">{bio.length} / {maxBio}</p>
          </div>
        </div>

        <div className="bg-white rounded-2xl p-6 shadow-sm">
          <h3 className="text-base font-bold text-[#1a1c1e] mb-4">Lưu ý</h3>
          <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-[#fff5f5] border border-[#ffd0d0]">
            <div>
              <p className="text-sm font-semibold text-[#ba1a1a]">Xóa tài khoản</p>
              <p className="text-xs text-[#565f71]">Cân nhắc kỹ trước khi xóa tài khoản</p>
            </div>
            <button
              onClick={handleDeleteAccount}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-[#ba1a1a] text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              Vô hiệu hóa tài khoản
            </button>
          </div>
        </div>

      </div>
    </div>
  )
}

export default ProfileDetails