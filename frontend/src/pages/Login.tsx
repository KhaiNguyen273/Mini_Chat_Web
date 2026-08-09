import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import AuthTemplate from '../templates/AuthTemplate'
import { useAuth } from '../hooks/useAuth'

function Login() {
  const { user, login } = useAuth()   // gộp lại 1 lần, không gọi useAuth() 2 lần
  const navigate = useNavigate()
  const [phone, setPhone] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const handleSubmit = async () => {
    try {
      await login({ phone, password })
      navigate('/chat', { replace: true })
    } catch {
      setError('Sai số điện thoại hoặc mật khẩu')
    }
  }

  // TẤT CẢ hook đã gọi xong ở trên rồi mới được return sớm
  if (user) return <Navigate to="/chat" replace />
  return (
    <AuthTemplate>
      <p className="text-sm text-center -mt-4 mb-6 text-[#565f71]">
        Chào mừng bạn quay trở lại.
      </p>

      {/* Số điện thoại */}
      <div className="mb-4">
        <label className="block text-sm font-medium mb-1 text-[#1a1c1e]">Số điện thoại</label>
        <div className="flex items-center rounded-lg px-3 py-2.5 border border-[#70787d] bg-white">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#70787d" strokeWidth="2" className="mr-2 shrink-0">
            <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72c.127.96.362 1.903.7 2.81a2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45c.907.338 1.85.573 2.81.7A2 2 0 0 1 22 16.92z"/>
          </svg>
          <input
            type="tel"
            placeholder="0912345678"
            value={phone}
            onChange={e => setPhone(e.target.value)}
            className="flex-1 outline-none text-sm bg-transparent text-[#1a1c1e] placeholder:text-[#70787d]"
          />
        </div>
      </div>

      {/* Mật khẩu */}
      <div className="mb-2">
        <label className="block text-sm font-medium mb-1 text-[#1a1c1e]">Mật khẩu</label>
        <div className="flex items-center rounded-lg px-3 py-2.5 border border-[#70787d] bg-white">
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#70787d" strokeWidth="2" className="mr-2 shrink-0">
            <rect x="3" y="11" width="18" height="11" rx="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <input
            type="password"
            placeholder="••••••••"
            value={password}
            onChange={e => setPassword(e.target.value)}
            className="flex-1 outline-none text-sm bg-transparent text-[#1a1c1e] placeholder:text-[#70787d]"
          />
        </div>
      </div>

      {/* Quên mật khẩu */}
      <div className="flex justify-end mb-5">
        <Link to="/forgot-password" className="text-sm text-[#2563eb]">
          Quên mật khẩu?
        </Link>
      </div>

      {/* Nút đăng nhập */}
      <button
        onClick={handleSubmit}
        className="w-full py-3 rounded-xl text-white font-semibold text-sm bg-[#2563eb] hover:opacity-90 transition-opacity"
      >
        Đăng nhập
      </button>

      {/* Đăng ký */}
      <p className="text-center text-sm mt-5 text-[#565f71]">
        Chưa có tài khoản?{' '}
        <Link to="/register" className="font-bold text-[#2563eb]">
          Đăng ký ngay
        </Link>
      </p>
    </AuthTemplate>
  )
}

export default Login