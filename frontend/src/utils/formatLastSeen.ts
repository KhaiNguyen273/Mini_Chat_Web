// src/utils/formatLastSeen.ts
export function formatLastSeen(lastSeenAt?: string | null): string {
  if (!lastSeenAt) return ''
  const diffMs = Date.now() - new Date(lastSeenAt).getTime()
  const diffMin = Math.floor(diffMs / 60000)

  if (diffMin < 1) return 'Vừa mới truy cập'
  if (diffMin < 60) return `Hoạt động ${diffMin} phút trước`
  const diffHour = Math.floor(diffMin / 60)
  if (diffHour < 24) return `Hoạt động ${diffHour} giờ trước`
  const diffDay = Math.floor(diffHour / 24)
  if (diffDay < 7) return `Hoạt động ${diffDay} ngày trước`
  return `Hoạt động lâu rồi`
}

export function formatSeenTime(isoString: string): string {
  const date = new Date(isoString)
  const weekdays = ['Chủ Nhật', 'Thứ Hai', 'Thứ Ba', 'Thứ Tư', 'Thứ Năm', 'Thứ Sáu', 'Thứ Bảy']
  const weekday = weekdays[date.getDay()]
  let hours = date.getHours()
  const minutes = date.getMinutes().toString().padStart(2, '0')
  const period = hours >= 12 ? 'ch' : 'sa'
  hours = hours % 12
  if (hours === 0) hours = 12
  return `${weekday} ${hours}:${minutes}${period}`
}