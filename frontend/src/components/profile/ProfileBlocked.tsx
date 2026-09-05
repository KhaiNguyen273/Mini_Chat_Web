import { useState, useEffect, useMemo } from 'react'
import ProfileHeader from './ProfileHeader'
import { getBlockedListApi, unblockUserApi } from '../../api/block.api'
import { useToast } from '../../hooks/useToast'
import { useConfirm } from '../../hooks/useConfirm'
import { DEFAULT_AVATAR_URL } from '../../constants'
import type { BlockedUser } from '../../types/block.types'

function ProfileBlocked() {
  const [list, setList] = useState<BlockedUser[]>([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState('')
  const [unblockingId, setUnblockingId] = useState<string | null>(null)
  const { showToast } = useToast()
  const confirm = useConfirm()

  useEffect(() => {
    getBlockedListApi().then(setList).finally(() => setLoading(false))
  }, [])

  const filtered = useMemo(
    () => list.filter((b) => b.name.toLowerCase().includes(keyword.toLowerCase())),
    [list, keyword]
  )

  const handleUnblock = async (userId: string, name: string) => {
    const ok = await confirm({
      title: 'Bỏ chặn người dùng',
      message: `Bỏ chặn ${name}? Người này sẽ có thể nhắn tin cho bạn trở lại.`,
      confirmText: 'Bỏ chặn',
    })
    if (!ok) return
    setUnblockingId(userId)
    try {
      await unblockUserApi(userId)
      setList((prev) => prev.filter((b) => b.user_id !== userId))
      showToast('Đã bỏ chặn', 'info')
    } catch {
      showToast('Không thể bỏ chặn, vui lòng thử lại', 'error')
    } finally {
      setUnblockingId(null)
    }
  }

  return (
    <div className="flex flex-col flex-1 h-full bg-[#f7f9fb] overflow-y-auto">
      <ProfileHeader title="Người dùng đã chặn" />
      <div className="max-w-2xl mx-auto w-full px-6 py-6 flex flex-col gap-4">
        <div className="flex items-center gap-2 bg-white rounded-full px-3 py-2 shadow-sm">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#70787d" strokeWidth="2">
            <circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/>
          </svg>
          <input
            type="text"
            placeholder="Tìm theo tên..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            className="flex-1 text-sm bg-transparent outline-none text-[#1a1c1e] placeholder:text-[#70787d]"
          />
        </div>

        <div className="bg-white rounded-2xl shadow-sm">
          {loading ? (
            <p className="text-sm text-center text-[#565f71] py-8">Đang tải...</p>
          ) : filtered.length === 0 ? (
            <p className="text-sm text-center text-[#565f71] py-8">
              {keyword ? 'Không tìm thấy kết quả' : 'Bạn chưa chặn ai'}
            </p>
          ) : (
            filtered.map((b) => (
              <div key={b.id} className="flex items-center gap-3 px-5 py-3 border-b last:border-b-0 border-[#e6ebef]">
                <img src={b.avatar_url || DEFAULT_AVATAR_URL} alt={b.name} className="w-11 h-11 rounded-full object-cover shrink-0"/>
                <p className="flex-1 text-sm font-semibold text-[#1a1c1e]">{b.name}</p>
                <button
                  onClick={() => handleUnblock(b.user_id, b.name)}
                  disabled={unblockingId === b.user_id}
                  className="px-3 py-1.5 rounded-lg border border-[#ba1a1a] text-xs font-semibold text-[#ba1a1a] hover:bg-[#fff0f0] disabled:opacity-50 transition-colors"
                >
                  {unblockingId === b.user_id ? 'Đang bỏ chặn...' : 'Bỏ chặn'}
                </button>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}

export default ProfileBlocked