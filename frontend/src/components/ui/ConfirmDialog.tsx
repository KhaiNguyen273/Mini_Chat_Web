import { useContext } from 'react'
import { ConfirmContext } from '../../stores/confirmStore'

function ConfirmDialog() {
  const ctx = useContext(ConfirmContext)
  if (!ctx || !ctx.state.open) return null

  const { title, message, confirmText, cancelText, danger, hideCancel } = ctx.state

  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-[200]" onClick={hideCancel ? undefined : ctx.handleCancel} />
      <div className="fixed inset-0 z-[201] flex items-center justify-center pointer-events-none">
        <div className="bg-white rounded-2xl shadow-xl w-[calc(100vw-2rem)] max-w-[360px] p-6 pointer-events-auto">
          <h3 className="text-base font-bold text-[#1a1c1e] mb-2">{title}</h3>
          <p className="text-sm text-[#565f71] mb-6">{message}</p>
          <div className="flex gap-3 justify-end">
            {!hideCancel && (
              <button
                onClick={ctx.handleCancel}
                className="px-4 py-2 rounded-xl text-sm font-semibold text-[#565f71] hover:bg-[#f2f4f6] transition-colors"
              >
                {cancelText || 'Huỷ'}
              </button>
            )}
            <button
              onClick={ctx.handleConfirm}
              className={`px-4 py-2 rounded-xl text-sm font-semibold text-white transition-opacity hover:opacity-90 ${
                danger ? 'bg-[#ba1a1a]' : 'bg-[#2563eb]'
              }`}
            >
              {confirmText || 'Xác nhận'}
            </button>
          </div>
        </div>
      </div>
    </>
  )
}

export default ConfirmDialog