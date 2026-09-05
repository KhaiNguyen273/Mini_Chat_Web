

// export default ContactsPage
import { useState, useEffect } from 'react'
import { useSearchParams } from 'react-router-dom'
import MainLayout from '../templates/MainLayout'
import ContactsSidebar from '../components/sidebar/contact/ContactsSidebar'
import ContactWindow from '../components/window/contact/ContactWindow'
import { useFriendship } from '../hooks/useFriendship'
import { useToast } from '../hooks/useToast'
import { useDebounce } from '../hooks/useDebounce'
import { getUserByIdApi } from '../api/user.api'
import type { SearchedContact } from '../types/friendship.types'
import { useIsMobile } from '../hooks/useIsMobile'

function ContactsPage() {
  const { searchContacts, friends, loading, refetchFriends } = useFriendship()
  const { showToast } = useToast()
  const [searchParams, setSearchParams] = useSearchParams()
  const [keyword, setKeyword] = useState('')
  const debouncedKeyword = useDebounce(keyword, 400)
  const [skipNextDebounce, setSkipNextDebounce] = useState(false)
  const isMobile = useIsMobile()

  const [results, setResults] = useState<SearchedContact[]>([])
  const [searching, setSearching] = useState(false)
  const [selectedId, setSelectedId] = useState<string | null>(null)

  const isSearching = debouncedKeyword.trim().length > 0

  const displayList: SearchedContact[] = isSearching
    ? results
    : friends.map((f) => ({
        id: f.id,
        phone: '',
        name: f.name,
        avatar_url: f.avatar_url,
        relation: 'friend' as const,
        friendship_id: f.friendship_id,
      }))

  const selected = displayList.find((c) => c.id == selectedId) || null

  // xử lý ?userId= — gọi search TRỰC TIẾP, không chờ debounce, để chọn đúng ngay lập tức
  useEffect(() => {
    const userId = searchParams.get('userId')
    if (!userId) return

    getUserByIdApi(userId)
      .then(async (user) => {
        setSkipNextDebounce(true)
        setKeyword(user.phone)
        setSearching(true)
        try {
          const data = await searchContacts(user.phone)
          setResults(data)
          setSelectedId(userId)
        } finally {
          setSearching(false)
        }
      })
      .catch(() => {
        showToast('Không tìm thấy người dùng', 'error')
      })
      .finally(() => {
        searchParams.delete('userId')
        setSearchParams(searchParams, { replace: true })
      })
  }, [])

  useEffect(() => {
    if (!selectedId && !isSearching && !loading && displayList.length > 0) {
      setSelectedId(displayList[0].id)
    }
  }, [selectedId, isSearching, loading, displayList])

  useEffect(() => {
    if (skipNextDebounce) {
      setSkipNextDebounce(false)
      return
    }
    if (!debouncedKeyword.trim()) {
      setResults([])
      return
    }
    let cancelled = false
    setSearching(true)
    searchContacts(debouncedKeyword)
      .then((data) => {
        if (!cancelled) setResults(data)
      })
      .finally(() => {
        if (!cancelled) setSearching(false)
      })
    return () => { cancelled = true }
  }, [debouncedKeyword])

  const updateContact = (id: string, patch: Partial<SearchedContact>) => {
    if (isSearching) {
      setResults((prev) => prev.map((c) => (c.id === id ? { ...c, ...patch } : c)))
    }
  }

  useEffect(() => {
    if (isMobile) return
    if (!selectedId && !isSearching && !loading && displayList.length > 0) {
      setSelectedId(displayList[0].id)
    }
  }, [selectedId, isSearching, loading, displayList, isMobile])

  return (
    <MainLayout>
      <ContactsSidebar
        list={displayList}
        selectedId={selectedId}
        onSelect={(c) => setSelectedId(c.id)}
        onSearch={setKeyword}
        loading={isSearching ? searching : loading}
        className={selectedId ? 'hidden' : 'flex'}
      />
      <div className={`${selectedId ? 'flex' : 'hidden'} md:flex flex-1 min-w-0`}>
        <ContactWindow
          contact={selected}
          onUpdateContact={updateContact}
          onFriendsChanged={refetchFriends}
          onBack={() => setSelectedId(null)}
        />
      </div>
    </MainLayout>
  )
}

export default ContactsPage