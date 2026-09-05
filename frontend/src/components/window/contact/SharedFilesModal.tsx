// src/components/contact/SharedFilesModal.tsx
import type { MediaItem } from "../../../types/media.types"

interface SharedFilesModalProps {
  files: MediaItem[]
  onClose: () => void
}

function FileTypeIcon({ category }: { category: string }) {
  if (category === 'image') {
    return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
  }
  if (category === 'video') {
    return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><polygon points="23 7 16 12 23 17 23 7"/><rect x="1" y="5" width="15" height="14" rx="2"/></svg>
  }
  return <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#2563eb" strokeWidth="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
}

function SharedFilesModal({ files, onClose }: SharedFilesModalProps) {
  return (
    <>
      <div className="fixed inset-0 bg-black/30 z-40" onClick={onClose}/>
      <div className="fixed inset-0 z-50 flex items-center justify-center pointer-events-none">
        <div className="bg-white rounded-2xl shadow-xl w-[calc(100vw-2rem)] max-w-[400px] max-h-[85vh] flex flex-col pointer-events-auto">
          <div className="flex items-center justify-between px-6 py-4 border-b border-[#e6ebef]">
            <div className="w-7"/>
            <h2 className="text-base font-bold text-[#1a1c1e]">Tệp đã chia sẻ ({files.length})</h2>
            <button onClick={onClose} className="w-7 h-7 rounded-full bg-[#f2f4f6] hover:bg-[#e6ebef] flex items-center justify-center">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#565f71" strokeWidth="2.5"><path d="M18 6 6 18M6 6l12 12"/></svg>
            </button>
          </div>

          <div className="overflow-y-auto flex-1 p-2">
            {files.map((f) => (
              <a key={f.id} href={f.file_url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 px-4 py-3 rounded-xl hover:bg-[#f7f9fb] transition-colors">
                <div className="w-9 h-9 rounded-lg bg-[#d7e3ff] flex items-center justify-center shrink-0">
                  <FileTypeIcon category={f.category} />
                </div>
                <p className="text-sm font-medium text-[#1a1c1e] truncate">{f.file_name}</p>
              </a>
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

export default SharedFilesModal