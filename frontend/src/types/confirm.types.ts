export interface ConfirmOptions {
  title: string
  message: string
  confirmText?: string
  cancelText?: string
  danger?: boolean
  hideCancel?: boolean // true = chỉ hiện nút xác nhận, dùng cho thông báo lỗi kiểu alert
}