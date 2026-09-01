import { useState, useRef } from 'react'
import { useFriendship } from '../../../hooks/useFriendship'
import { useToast } from '../../../hooks/useToast'
import { uploadImageApi } from '../../../api/upload.api'
import { DEFAULT_AVATAR_URL } from '../../../constants'
import { useConversationContext } from '../../../contexts/ConversationContext'
import GroupAvatar from '../../ui/GroupAvatar'

interface CreateGroupPopupProps {
  onClose: () => void
}

function CreateGroupPopup({ onClose }: CreateGroupPopupProps) {
  const { friends } = useFriendship()
  const { createGroup } = useConversationContext()
  const { showToast } = useToast()

  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const [groupName, setGroupName] = useState('')
  const [step, setStep] = useState<'members' | 'name'>('members')
  const [creating, setCreating] = useState(false)

  const [avatarFile, setAvatarFile] = useState<File | null>(null)
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
  const avatarInputRef = useRef<HTMLInputElement>(null)

  const filtered = friends.filter(u => u.name.toLowerCase().includes(search.toLowerCase()))

  const toggleSelect = (id: string) => {
    setSelected(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id])
  }

  const selectedUsers = friends.filter(u => selected.includes(u.id))

  const handleAvatarChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (!file.type.startsWith('image/')) {
      showToast('Chỉ chấp nhận file ảnh', 'error')
      return
    }
    setAvatarFile(file)
    setAvatarPreview(URL.createObjectURL(file))
  }

  const handleCreate = async () => {
    if (!groupName.trim() || creating) return
    setCreating(true)
    try {
      let avatar_url: string | null = null
      if (avatarFile) {
        const uploaded = await uploadImageApi(avatarFile)
        avatar_url = uploaded.url
      }

      await createGroup({ name: groupName, memberIds: selected, avatar_url })
      onClose()
    } catch {
      showToast('Tạo nhóm thất bại, vui lòng thử lại', 'error')
    } finally {
      setCreating(false)
    }
  }

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose}/>

      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div className="bg-white rounded-2xl shadow-xl w-[480px] max-h-[600px] flex flex-col">

          <div className="flex items-center justify-between px-6 py-4 border-b border-[#e6ebef]">
            <div className="w-7"/>
            <h2 className="text-base font-bold text-[#1a1c1e]">
              {step === 'members' ? 'Tạo nhóm' : 'Đặt tên nhóm'}
            </h2>
            <button
              onClick={step === 'name' ? () => setStep('members') : onClose}
              className="w-7 h-7 rounded-full bg-[#f2f4f6] hover:bg-[#e6ebef] flex items-center justify-center transition-colors"
            >
              {step === 'name' ? (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#565f71" strokeWidth="2.5"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
              ) : (
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#565f71" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
              )}
            </button>
          </div>

          {step === 'members' ? (
            <>
              <div className="px-4 py-3 border-b border-[#e6ebef]">
                <div className="flex items-center gap-2 bg-[#f2f4f6] rounded-full px-3 py-2">
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#70787d" strokeWidth="2"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.35-4.35"/></svg>
                  <input
                    type="text"
                    placeholder="Tìm kiếm bạn bè..."
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    className="flex-1 text-xs bg-transparent outline-none text-[#1a1c1e] placeholder:text-[#70787d]"
                    autoFocus
                  />
                </div>

                {selected.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-2">
                    {selectedUsers.map(u => (
                      <div key={u.id} className="flex items-center gap-1.5 bg-[#d7e3ff] rounded-full px-2.5 py-1">
                        <img src={u.avatar_url||DEFAULT_AVATAR_URL} alt={u.name} className="w-5 h-5 rounded-full object-cover"/>
                        <span className="text-xs font-medium text-[#2563eb]">{u.name}</span>
                        <button onClick={() => toggleSelect(u.id)}>
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="3"><path d="M18 6 6 18M6 6l12 12"/></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="overflow-y-auto flex-1 py-2">
                {filtered.map(u => {
                  const isSelected = selected.includes(u.id)
                  return (
                    <div
                      key={u.id}
                      onClick={() => toggleSelect(u.id)}
                      className="flex items-center gap-3 px-6 py-3 hover:bg-[#f7f9fb] cursor-pointer transition-colors"
                    >
                      <img src={u.avatar_url||DEFAULT_AVATAR_URL} alt={u.name} className="w-11 h-11 rounded-full object-cover shrink-0"/>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-[#1a1c1e]">{u.name}</p>
                      </div>
                      <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${
                        isSelected ? 'bg-[#2563eb] border-[#2563eb]' : 'border-[#70787d]'
                      }`}>
                        {isSelected && (
                          <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="3"><path d="M20 6 9 17l-5-5"/></svg>
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>

              <div className="px-6 py-4 border-t border-[#e6ebef]">
                <button
                  onClick={() => selected.length >= 2 && setStep('name')}
                  className={`w-full py-2.5 rounded-xl text-white text-sm font-semibold transition-opacity ${
                    selected.length >= 2 ? 'bg-[#2563eb] hover:opacity-90' : 'bg-[#d7e3ff] cursor-not-allowed'
                  }`}
                >
                  Tiếp theo ({selected.length} đã chọn)
                </button>
              </div>
            </>
          ) : (
            <>
              <div className="flex flex-col gap-6 px-6 py-6 flex-1">

                <div className="flex flex-col items-center gap-3">
                  <input
                    ref={avatarInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={handleAvatarChange}
                  />
                  <div
                    onClick={() => avatarInputRef.current?.click()}
                    className="w-20 h-20 rounded-full bg-[#f2f4f6] flex items-center justify-center cursor-pointer hover:bg-[#e6ebef] transition-colors overflow-hidden"
                  >
                    {avatarPreview ? (
                      <img src={avatarPreview} alt="preview" className="w-full h-full object-cover"/>
                    ) : selectedUsers.length >= 2 ? (
                      <GroupAvatar memberAvatars={selectedUsers.map((u) => u.avatar_url)} size={80} />
                    ) : (
                      <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#70787d" strokeWidth="1.5">
                        <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
                        <polyline points="17 8 12 3 7 8"/>
                        <line x1="12" y1="3" x2="12" y2="15"/>
                      </svg>
                    )}
                  </div>
                  <span className="text-xs text-[#565f71]">Thêm ảnh nhóm</span>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#2563eb] mb-1">Tên nhóm</label>
                  <input
                    type="text"
                    placeholder="Nhập tên nhóm..."
                    value={groupName}
                    onChange={e => setGroupName(e.target.value)}
                    autoFocus
                    className="w-full px-3 py-2.5 rounded-lg border border-[#70787d] text-sm text-[#1a1c1e] outline-none focus:border-[#2563eb] transition-colors"
                  />
                </div>

                <div>
                  <p className="text-sm font-medium text-[#565f71] mb-2">Thành viên ({selectedUsers.length})</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedUsers.map(u => (
                      <div key={u.id} className="flex items-center gap-2 bg-[#f7f9fb] rounded-xl px-3 py-2">
                        <img src={u.avatar_url||DEFAULT_AVATAR_URL} alt={u.name} className="w-6 h-6 rounded-full object-cover"/>
                        <span className="text-xs font-medium text-[#1a1c1e]">{u.name}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-[#e6ebef]">
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className={`w-full py-2.5 rounded-xl text-white text-sm font-semibold transition-opacity ${
                    groupName.trim() && !creating ? 'bg-[#2563eb] hover:opacity-90' : 'bg-[#d7e3ff] cursor-not-allowed'
                  }`}
                >
                  {creating ? 'Đang tạo...' : 'Tạo nhóm'}
                </button>
              </div>
            </>
          )}

        </div>
      </div>
    </>
  )
}

export default CreateGroupPopup