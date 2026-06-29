import { useRef, useState } from 'react'
import { UploadCloud } from 'lucide-react'

interface FileDropzoneProps {
  onFiles: (files: File[]) => void
  multiple?: boolean
  label?: string
}

export default function FileDropzone({ onFiles, multiple = false, label }: FileDropzoneProps) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const handle = (files: FileList | null) => {
    if (!files) return
    const pdfs = Array.from(files).filter((f) => f.type === 'application/pdf')
    if (pdfs.length) onFiles(pdfs)
  }

  return (
    <div
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={(e) => { e.preventDefault(); setDragging(false); handle(e.dataTransfer.files) }}
      className={`flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl p-6 sm:p-12 cursor-pointer transition-colors
        ${dragging ? 'border-purple-500 bg-purple-500/5' : 'border-gray-700 hover:border-gray-500 hover:bg-gray-800/30'}`}
    >
      <UploadCloud size={36} className={dragging ? 'text-purple-400' : 'text-gray-600'} />
      <p className="text-sm text-gray-400">
        {label ?? (multiple ? 'Arrastra los PDFs o haz clic para seleccionar' : 'Arrastra un PDF o haz clic para seleccionar')}
      </p>
      <p className="text-xs text-gray-600">Solo archivos .pdf</p>
      <input
        ref={inputRef}
        type="file"
        accept="application/pdf"
        multiple={multiple}
        className="hidden"
        onChange={(e) => handle(e.target.files)}
      />
    </div>
  )
}
