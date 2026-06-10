import { useState } from 'react'
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
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')

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
    if (files.length < 2) return
    setStatus('processing')
    setErrorMsg('')
    try {
      const bytes = await mergePdfs(files)
      const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' })
      const url = URL.createObjectURL(blob)
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
          {/* Lista con scroll interno */}
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

          {/* Botón fijo abajo */}
          <div className="shrink-0 flex flex-col gap-2 pt-2 border-t border-gray-800">
            {status === 'done' && <p className="text-xs text-green-400">Descargado correctamente.</p>}
            {status === 'error' && <p className="text-xs text-red-400">{errorMsg}</p>}
            <button
              onClick={handleMerge}
              disabled={files.length < 2 || status === 'processing'}
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

  const preview = files[selected]
    ? <PdfViewer file={files[selected]} />
    : (
      <div className="flex items-center justify-center h-full text-sm text-gray-700">
        Agrega archivos para ver la vista previa
      </div>
    )

  return (
    <ToolLayout
      title="Unir PDFs"
      description="Combina múltiples PDFs en uno. Haz clic en un archivo para previsualizarlo."
      panel={panel}
      preview={preview}
    />
  )
}
