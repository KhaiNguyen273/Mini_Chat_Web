import { useState, useEffect } from 'react'
import MainLayout from '../templates/MainLayout'
import ContactsSidebar from '../components/sidebar/contact/ContactsSidebar'
import ContactWindow from '../components/window/contact/ContactWindow'
import { useFriendship } from '../hooks/useFriendship'
import { useDebounce } from '../hooks/useDebounce'
import type { SearchedContact } from '../types/friendship.types'

function ContactsPage() {
  const { searchContacts, friends, loading } = useFriendship()
  const [keyword, setKeyword] = useState('')
  const debouncedKeyword = useDebounce(keyword, 400)

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

  const selected = displayList.find((c) => c.id === selectedId) || null

  // chưa chọn ai + đang xem danh sách bạn bè (không phải kết quả search)
  // → tự chọn người đầu tiên trong danh sách
  useEffect(() => {
    if (!selectedId && !isSearching && !loading && displayList.length > 0) {
      setSelectedId(displayList[0].id)
    }
  }, [selectedId, isSearching, loading, displayList])

  useEffect(() => {
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

  return (
    <MainLayout>
      <ContactsSidebar
        list={displayList}
        selectedId={selectedId}
        onSelect={(c) => setSelectedId(c.id)}
        onSearch={setKeyword}
        loading={isSearching ? searching : loading}
      />
      <ContactWindow contact={selected} onUpdateContact={updateContact} />
    </MainLayout>
  )
}

export default ContactsPage