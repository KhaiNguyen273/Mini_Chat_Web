import { useState, useRef, useEffect } from 'react'
import ProfileHeader from './ProfileHeader'
import { useUser } from '../../hooks/useUser'
import { useToast } from '../../hooks/useToast'
import { DEFAULT_AVATAR_URL } from '../../constants'

function ProfileDetails() {
  const {showToast} = useToast()
  const { user, updateProfile, uploadAvatar, deleteAccount, loading } = useUser()
  const [isEditing, setIsEditing] = useState(false)
  const [name, setName] = useState(user?.name || '')
  const [bio, setBio] = useState(user?.bio || '')
  const [avatar_url, setAvatar] = useState(user?.avatar_url || '')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const maxBio = 160

  // user có thể chưa sẵn sàng lúc mount (đang chờ getMe) → đồng bộ lại khi user load xong
  useEffect(() => {
    if (user) {
      setName(user.name)
      setBio(user.bio || '')
      setAvatar(user?.avatar_url || '')
    }
  }, [user])

  const handleCancel = () => {
    setName(user?.name || '')
    setBio(user?.bio || '')
    setAvatar(user?.avatar_url || '')
    setIsEditing(false)
  }

  const handleSave = async () => {
    try {
      await updateProfile({ name, bio, avatar_url })
      setIsEditing(false)
      showToast("Lưu thay đổi thành công","success")
    } catch {
      showToast("Lưu thay đổi thất bại","error")
    }
  }

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) await uploadAvatar(file)
    e.target.value = ''
  }

  const handleDeleteAccount = async () => {
    if (!confirm('Bạn chắc chắn muốn vô hiệu hoá tài khoản?')) return
    try {
      await deleteAccount()
      // sau khi xoá, backend chỉ soft-delete — vẫn nên đăng xuất user ở FE
      window.location.href = '/login'
      showToast("Đã vô hiệu hóa tài khoản","success")
    } catch {
      showToast("Đã vô hiệu hóa tài khoản thất bại","error")
    }
  }

  return (
    <div className="flex flex-col flex-1 h-full bg-[#f7f9fb] overflow-y-auto">
      <ProfileHeader title="Chi tiết tài khoản">
        {isEditing ? (
          <div className="flex items-center gap-3">
            <button
              onClick={handleCancel}
              disabled={loading}
              className="text-sm text-[#565f71] hover:text-[#1a1c1e] transition-colors"
            >
              Hủy
            </button>
            <button
              onClick={handleSave}
              disabled={loading}
              className="px-4 py-2 rounded-xl bg-[#2563eb] text-white text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60"
            >
              {loading ? 'Đang lưu...' : 'Lưu thay đổi'}
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

        {/* Profile Picture */}
        <div className="bg-white rounded-2xl px-6 py-2 flex items-center gap-5 shadow-sm">
          <img
            src={avatar_url || DEFAULT_AVATAR_URL}
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
                  disabled={loading}
                  className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[#70787d] text-sm text-[#565f71] hover:bg-[#f2f4f6] transition-colors"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#565f71" strokeWidth="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                    <polyline points="17 8 12 3 7 8"/>
                    <line x1="12" y1="3" x2="12" y2="15"/>
                  </svg>
                  Đổi ảnh đại diện
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Form */}
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

        {/* Danger Zone */}
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