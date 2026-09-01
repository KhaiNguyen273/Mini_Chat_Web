// đếm số socket đang mở của mỗi user — chỉ báo offline khi về 0. Thuần
// in-memory, mất khi server restart (đánh đổi đã chấp nhận, không dùng Redis)
const onlineUsers = new Map<number, number>();

export const markUserOnline = (userId: number): boolean => {
  const count = onlineUsers.get(userId) || 0;
  onlineUsers.set(userId, count + 1);
  return count === 0; // true = vừa chuyển từ offline -> online (tab đầu tiên)
};

export const markUserOffline = (userId: number): boolean => {
  const count = onlineUsers.get(userId) || 0;
  if (count <= 1) {
    onlineUsers.delete(userId);
    return true; // true = vừa chuyển từ online -> offline (tab cuối cùng đóng)
  }
  onlineUsers.set(userId, count - 1);
  return false;
};

export const isUserOnline = (userId: number): boolean => onlineUsers.has(userId);