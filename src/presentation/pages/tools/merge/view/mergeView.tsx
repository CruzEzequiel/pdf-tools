import { useState, useEffect, useRef } from 'react'
import { Download, Loader2, Plus } from 'lucide-react'
import FileDropzone from '../../../../components/ui/FileDropzone'
import FileList from './components/FileList'
import ToolLayout from '../../../../components/ui/ToolLayout'
import PdfViewer from '../../../../components/ui/PdfViewer'
import { mergePdfs } from '../../../../../infrastructure/useCases/mergePdfs'

type Status = 'idle' | 'processing' | 'done' | 'error'

export default function MergeView() {
  const [files, setFiles] = useState<File[]>([])
  const [selected, setSelected] = useState<number>(0)
  const [previewFile, setPreviewFile] = useState<File | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Regenera el preview unido cada vez que cambia la lista o el orden
  useEffect(() => {
    if (files.length === 0) { setPreviewFile(null); return }
    if (files.length === 1) { setPreviewFile(files[0]); return }

    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      try {
        const bytes = await mergePdfs(files)
        const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' })
        setPreviewFile(new File([blob], 'merged.pdf', { type: 'application/pdf' }))
      } catch {
        // fallo silencioso en preview
      }
    }, 400)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [files])

  const addFiles = (incoming: File[]) => {
    setFiles((prev) => {
      const existing = new Set(prev.map((f) => f.name))
      const next = [...prev, ...incoming.filter((f) => !existing.has(f.name))]
      setSelected(next.length - 1)
      return next
    })
    setStatus('idle')
  }

  const remove = (index: number) => {
    setFiles((prev) => {
      const next = prev.filter((_, i) => i !== index)
      setSelected((s) => Math.min(s, next.length - 1))
      return next
    })
    setStatus('idle')
  }

  const move = (from: number, to: number) => {
    setFiles((prev) => {
      const next = [...prev]
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item)
      return next
    })
  }

  const handleMerge = async () => {
    if (!previewFile) return
    setStatus('processing')
    setErrorMsg('')
    try {
      const url = URL.createObjectURL(previewFile)
      const a = document.createElement('a')
      a.href = url
      a.download = 'merged.pdf'
      a.click()
      URL.revokeObjectURL(url)
      setStatus('done')
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Error al unir los PDFs')
      setStatus('error')
    }
  }

  const panel = (
    <div className="flex flex-col h-full min-h-0 gap-3">
      {files.length === 0 ? (
        <FileDropzone onFiles={addFiles} multiple label="Arrastra los PDFs aquí" />
      ) : (
        <>
          <div className="flex-1 overflow-y-auto flex flex-col gap-3 min-h-0">
            <FileList
              files={files}
              selected={selected}
              onSelect={setSelected}
              onRemove={remove}
              onMove={move}
            />
            <button
              onClick={() => {
                const input = document.createElement('input')
                input.type = 'file'
                input.accept = 'application/pdf'
                input.multiple = true
                input.onchange = (e) => {
                  const f = (e.target as HTMLInputElement).files
                  if (f) addFiles(Array.from(f))
                }
                input.click()
              }}
              className="flex items-center gap-2 text-xs text-gray-600 hover:text-purple-400 transition-colors self-start px-1"
            >
              <Plus size={13} /> Agregar más PDFs
            </button>
          </div>

          <div className="shrink-0 flex flex-col gap-2 pt-2 border-t border-gray-800">
            {status === 'done' && <p className="text-xs text-green-400">Descargado correctamente.</p>}
            {status === 'error' && <p className="text-xs text-red-400">{errorMsg}</p>}
            <button
              onClick={handleMerge}
              disabled={files.length < 2 || status === 'processing' || !previewFile}
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
            >
              {status === 'processing'
                ? <><Loader2 size={15} className="animate-spin" /> Procesando...</>
                : <><Download size={15} /> Unir y descargar</>
              }
            </button>
          </div>
        </>
      )}
    </div>
  )

  const preview = previewFile
    ? <PdfViewer file={previewFile} />
    : (
      <div className="flex items-center justify-center h-full text-sm text-gray-700">
        Agrega archivos para ver la vista previa
      </div>
    )

  const previewLabel = files.length > 1
    ? `Resultado: ${files.length} PDFs unidos`
    : files[0]?.name

  return (
    <ToolLayout
      title="Unir PDFs"
      description="Combina múltiples PDFs en uno. La vista previa muestra el resultado final."
      panel={panel}
      preview={preview}
      previewLabel={previewLabel}
    />
  )
}
