import { useState, useEffect } from 'react'

export function useDebounce<T>(value: T, delay = 400): T {
  const [debounced, setDebounced] = useState(value)

  useEffect(() => {
    const timer = setTimeout(() => setDebounced(value), delay)
    return () => clearTimeout(timer) // huỷ timer cũ mỗi khi value đổi trước khi hết delay
  }, [value, delay])

  return debounced
}