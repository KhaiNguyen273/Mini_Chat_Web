import { useState } from 'react'
import ProfileHeader from './ProfileHeader'
import { useUser } from '../../hooks/useUser'
import { useToast } from '../../hooks/useToast'

function ProfileSecurity() {
  const [current, setCurrent] = useState('')
  const [newPass, setNewPass] = useState('')
  const [confirm, setConfirm] = useState('')
  const { changePassword, error } = useUser()
  const {showToast} = useToast()

  const handleChange = async () => {
    if (!current || !newPass || !confirm) return
    if (newPass !== confirm) return showToast('Mật khẩu xác nhận không khớp!', 'info')
    if (newPass === current) return showToast('Mật khẩu mới phải khác mật khẩu hiện tại', 'info')
    try {
      await changePassword({ oldPassword: current, newPassword: newPass })
      setCurrent(''); setNewPass(''); setConfirm('')
      showToast('Đổi mật khẩu thành công', 'success')
    } catch (err: any) {
      const msg = err.response?.data?.message
      if (msg === 'Old password incorrect') showToast('Mật khẩu hiện tại không đúng', 'error')
      else if (msg === 'New password must be different from old password') showToast('Mật khẩu mới phải khác mật khẩu hiện tại', 'error')
      else showToast('Đổi mật khẩu thất bại', 'error')
    }
  }

  return (
    <div className="flex flex-col flex-1 h-full bg-[#f7f9fb] overflow-y-auto">
      <ProfileHeader title="Bảo mật" />

      <div className="max-w-2xl mx-auto w-full px-6 py-6 flex flex-col gap-6">

        {/* Đổi mật khẩu */}
        <div className="bg-white rounded-2xl p-6 shadow-sm flex flex-col gap-4">
          <h3 className="text-sm font-bold text-[#1a1c1e]">Đổi mật khẩu</h3>

          <div>
            <label className="block text-sm font-medium text-[#2563eb] mb-1">Mật khẩu hiện tại</label>
            <input type="password" placeholder="••••••••" value={current}
              onChange={e => setCurrent(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-[#70787d] text-sm outline-none focus:border-[#2563eb] transition-colors"/>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#2563eb] mb-1">Mật khẩu mới</label>
            <input type="password" placeholder="••••••••" value={newPass}
              onChange={e => setNewPass(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-[#70787d] text-sm outline-none focus:border-[#2563eb] transition-colors"/>
          </div>

          <div>
            <label className="block text-sm font-medium text-[#2563eb] mb-1">Xác nhận mật khẩu mới</label>
            <input type="password" placeholder="••••••••" value={confirm}
              onChange={e => setConfirm(e.target.value)}
              className="w-full px-3 py-2.5 rounded-lg border border-[#70787d] text-sm outline-none focus:border-[#2563eb] transition-colors"/>
          </div>

          <button
            onClick={handleChange}
            className="self-end px-5 py-2.5 rounded-xl bg-[#2563eb] text-white text-sm font-semibold hover:opacity-90 transition-opacity"
          >
            Xác nhận đổi mật khẩu
          </button>
        </div>

        {/* 2FA */}
        {/* <div className="bg-white rounded-2xl p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-semibold text-[#1a1c1e]">Xác thực 2 bước</p>
              <p className="text-xs text-[#565f71] mt-0.5">Tăng cường bảo mật cho tài khoản.</p>
            </div>
            <div className="w-11 h-6 bg-[#2563eb] rounded-full relative cursor-pointer">
              <div className="w-5 h-5 bg-white rounded-full absolute top-0.5 right-0.5 shadow"/>
            </div>
          </div>
        </div> */}

      </div>
    </div>
  )
}

export default ProfileSecurity