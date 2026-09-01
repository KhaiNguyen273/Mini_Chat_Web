// src/utils/messagePreview.ts
export function getLastMessagePreview(lastMessage?: { content: string | null; type: string } | null): string {
  if (!lastMessage) return 'Chưa có tin nhắn'

  if (lastMessage.content) return lastMessage.content

  switch (lastMessage.type) {
    case 'image':
      return 'Đã gửi ảnh'
    case 'video':
      return 'Đã gửi video'
    case 'file':
      return 'Đã gửi tệp'
    default:
      return 'Chưa có tin nhắn'
  }
}