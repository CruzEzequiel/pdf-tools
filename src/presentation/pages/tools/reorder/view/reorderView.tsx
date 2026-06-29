import { useState, useEffect, useRef } from 'react'
import { Download, Loader2, GripVertical } from 'lucide-react'
import FileDropzone from '../../../../components/ui/FileDropzone'
import ToolLayout from '../../../../components/ui/ToolLayout'
import PdfViewer from '../../../../components/ui/PdfViewer'
import { renderAllPages } from '../../../../../infrastructure/services/pdfRenderer'
import { reorderPages } from '../../../../../infrastructure/useCases/reorderPages'

type Status = 'idle' | 'loading' | 'ready' | 'processing' | 'done' | 'error'

interface PageItem {
  originalPage: number // 1-based, nunca cambia
  dataUrl: string
}

export default function ReorderView() {
  const [file, setFile] = useState<File | null>(null)
  const [pages, setPages] = useState<PageItem[]>([])
  const [previewFile, setPreviewFile] = useState<File | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const [dragging, setDragging] = useState(-1)
  const [dragOver, setDragOver] = useState(-1)

  useEffect(() => {
    if (!file) return
    setStatus('loading')
    setPages([])
    setPreviewFile(null)

    renderAllPages(file, 0.6).then((urls) => {
      setPages(urls.map((dataUrl, i) => ({ originalPage: i + 1, dataUrl })))
      setPreviewFile(file)
      setStatus('ready')
    }).catch(() => {
      setErrorMsg('No se pudo leer el PDF.')
      setStatus('error')
    })
  }, [file])

  // Regenera el preview con el orden actual
  useEffect(() => {
    if (!file || pages.length === 0) return

    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      try {
        const order = pages.map((p) => p.originalPage)
        const bytes = await reorderPages(file, order)
        const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' })
        setPreviewFile(new File([blob], file.name, { type: 'application/pdf' }))
      } catch {
        // preview silencioso
      }
    }, 400)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [pages, file])

  const move = (from: number, to: number) => {
    setPages((prev) => {
      const next = [...prev]
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item)
      return next
    })
  }

  const handleDragStart = (e: React.DragEvent, i: number) => {
    e.dataTransfer.setData('text/plain', String(i))
    e.dataTransfer.effectAllowed = 'move'
    setDragging(i)
  }

  const handleDragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
    setDragOver(i)
  }

  const handleDrop = (e: React.DragEvent, i: number) => {
    e.preventDefault()
    const from = Number(e.dataTransfer.getData('text/plain'))
    if (!isNaN(from) && from !== i) move(from, i)
    setDragging(-1)
    setDragOver(-1)
  }

  const handleDragEnd = () => {
    setDragging(-1)
    setDragOver(-1)
  }

  const handleDownload = async () => {
    if (!previewFile) return
    setStatus('processing')
    setErrorMsg('')
    try {
      const url = URL.createObjectURL(previewFile)
      const a = document.createElement('a')
      a.href = url
      a.download = file!.name.replace(/\.pdf$/i, '_reordenado.pdf')
      a.click()
      URL.revokeObjectURL(url)
      setStatus('done')
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Error al descargar')
      setStatus('error')
    }
  }

  const reset = () => {
    setFile(null)
    setPages([])
    setPreviewFile(null)
    setStatus('idle')
    setErrorMsg('')
  }

  const isOriginalOrder = pages.every((p, i) => p.originalPage === i + 1)

  const panel = (
    <div className="flex flex-col h-full min-h-0 gap-3">
      {!file ? (
        <FileDropzone onFiles={(f) => setFile(f[0])} />
      ) : (
        <>
          {status === 'loading' && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Loader2 size={12} className="animate-spin" /> Cargando páginas...
            </div>
          )}

          {(status === 'ready' || status === 'processing' || status === 'done' || status === 'error') && (
            <>
              <p className="shrink-0 text-xs text-gray-600">
                Arrastra las páginas para cambiar el orden
              </p>

              {/* Lista de páginas arrastrables */}
              <div className="flex-1 overflow-y-auto min-h-0">
                <ul className="flex flex-col gap-2 pb-2">
                  {pages.map((page, i) => {
                    const isDragging = dragging === i
                    const isOver = dragOver === i
                    const insertAbove = isOver && dragging > i
                    const insertBelow = isOver && dragging < i

                    return (
                      <li
                        key={`${page.originalPage}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e, i)}
                        onDragOver={(e) => handleDragOver(e, i)}
                        onDrop={(e) => handleDrop(e, i)}
                        onDragEnd={handleDragEnd}
                        className={`relative flex items-center gap-2 px-2 py-2 rounded-lg border cursor-grab transition-all duration-150
                          ${insertAbove ? 'translate-y-1' : ''}
                          ${insertBelow ? '-translate-y-1' : ''}
                          ${isDragging
                            ? 'opacity-40 scale-[0.98] border-gray-600 bg-gray-800/60'
                            : 'border-gray-700 bg-gray-800/30 hover:border-gray-500'
                          }`}
                      >
                        {insertAbove && (
                          <span className="absolute -top-1.5 left-0 right-0 h-0.5 rounded-full bg-purple-500" />
                        )}

                        <GripVertical size={14} className="text-gray-600 shrink-0" />

                        <div className="w-10 h-14 rounded overflow-hidden bg-gray-900 shrink-0">
                          <img src={page.dataUrl} alt="" className="w-full h-full object-cover" />
                        </div>

                        <div className="flex-1 min-w-0">
                          <p className="text-xs text-gray-300">Página {i + 1}</p>
                          {page.originalPage !== i + 1 && (
                            <p className="text-[10px] text-purple-400">original: p. {page.originalPage}</p>
                          )}
                        </div>

                        {insertBelow && (
                          <span className="absolute -bottom-1.5 left-0 right-0 h-0.5 rounded-full bg-purple-500" />
                        )}
                      </li>
                    )
                  })}
                </ul>
              </div>

              <div className="shrink-0 flex flex-col gap-2 pt-2 border-t border-gray-800">
                {status === 'done' && <p className="text-xs text-green-400">Descargado correctamente.</p>}
                {status === 'error' && <p className="text-xs text-red-400">{errorMsg}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={reset}
                    className="px-3 py-2 rounded-lg border border-gray-700 text-xs text-gray-500 hover:text-gray-300 hover:border-gray-500 transition-colors"
                  >
                    Cambiar PDF
                  </button>
                  <button
                    onClick={handleDownload}
                    disabled={isOriginalOrder || status === 'processing'}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
                  >
                    {status === 'processing'
                      ? <><Loader2 size={14} className="animate-spin" /> Procesando...</>
                      : <><Download size={14} /> Descargar</>
                    }
                  </button>
                </div>
              </div>
            </>
          )}

          {status === 'error' && (
            <p className="text-xs text-red-400">{errorMsg}</p>
          )}
        </>
      )}
    </div>
  )

  const preview = previewFile
    ? <PdfViewer file={previewFile} />
    : (
      <div className="flex items-center justify-center h-full text-sm text-gray-700">
        Sube un PDF para comenzar
      </div>
    )

  return (
    <ToolLayout
      title="Reordenar páginas"
      description="Arrastra las páginas para cambiar su orden. La vista previa se actualiza en tiempo real."
      panel={panel}
      preview={preview}
      previewLabel={file?.name}
    />
  )
}
