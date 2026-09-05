// So sánh 2 timestamp theo cấp độ GIÂY — bỏ qua sai lệch mili-giây phát
// sinh do MySQL NOW() cắt phần thập phân trong khi created_at của message
// lại giữ nguyên mili-giây. Nếu không floor, việc gửi tin và mark-as-read
// xảy ra trong cùng 1 giây sẽ bị so sánh sai chiều, khiến unread bật/tắt
// chập chờn ngay sau khi vừa đọc xong.
export function isAfterBySecond(isoA: string, isoB: string): boolean {
  const a = Math.floor(new Date(isoA).getTime() / 1000)
  const b = Math.floor(new Date(isoB).getTime() / 1000)
  return a > b
}