import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import MainLayout from '../templates/MainLayout'
import PendingSidebar from '../components/sidebar/pending/PendingSidebar'
import PendingWindow from '../components/window/pending/PendingWindow'
import { usePending } from '../hooks/usePending'
import { useToast } from '../hooks/useToast'
import { useIsMobile } from '../hooks/useIsMobile'

function PendingPage() {
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { pendingList, loading, accept, reject } = usePending()
  const [selectedId, setSelectedId] = useState<string | null>(null)
  const isMobile = useIsMobile()

  // pendingList đã sort created_at DESC từ backend → phần tử đầu là mới nhất
  // tự chọn khi chưa có lựa chọn nào và danh sách đã tải xong, có dữ liệu
  useEffect(() => {
    if (!selectedId && !loading && pendingList.length > 0) {
      setSelectedId(pendingList[0].id)
    }
  }, [selectedId, loading, pendingList])

  useEffect(() => {
    if (isMobile) return
    if (!selectedId && !loading && pendingList.length > 0) {
      setSelectedId(pendingList[0].id)
    }
  }, [selectedId, loading, pendingList, isMobile])

  const selected = pendingList.find((c) => c.id === selectedId) || null

  const handleAccept = async (id: string) => {
    try {
      await accept(id)
      showToast('Đã chấp nhận, chuyển sang đoạn chat', 'success')
      navigate(`/chat/${id}`)
    } catch {
      showToast('Không thể chấp nhận, vui lòng thử lại', 'error')
    }
  }

  const handleReject = async (id: string) => {
    try {
      await reject(id)
      setSelectedId(null) // reset để effect tự chọn item tiếp theo nếu còn
      showToast('Đã từ chối tin nhắn', 'info')
    } catch {
      showToast('Không thể từ chối, vui lòng thử lại', 'error')
    }
  }

  return (
    <MainLayout>
      <PendingSidebar
        list={pendingList}
        loading={loading}
        selectedId={selectedId}
        onSelect={setSelectedId}
        className={selectedId ? 'hidden' : 'flex'}
      />
      <div className={`${selectedId ? 'flex' : 'hidden'} md:flex flex-1 min-w-0`}>
        <PendingWindow
          conversation={selected}
          onAccept={handleAccept}
          onReject={handleReject}
          onBack={() => setSelectedId(null)}
        />
      </div>
    </MainLayout>
  )
}

export default PendingPage