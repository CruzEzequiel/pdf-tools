import { useState, useEffect, useRef } from 'react'
import { Download, Loader2, RotateCw, RotateCcw, CheckSquare, Square } from 'lucide-react'
import FileDropzone from '../../../../components/ui/FileDropzone'
import ToolLayout from '../../../../components/ui/ToolLayout'
import PdfViewer from '../../../../components/ui/PdfViewer'
import { renderAllPages } from '../../../../../infrastructure/services/pdfRenderer'
import { rotatePdf } from '../../../../../infrastructure/useCases/rotatePdf'
import type { RotationAngle } from '../../../../../infrastructure/useCases/rotatePdf'

type Status = 'idle' | 'loading' | 'ready' | 'processing' | 'done' | 'error'

interface PageThumb {
  dataUrl: string
  rotation: number
}

export default function RotateView() {
  const [file, setFile] = useState<File | null>(null)
  const [thumbs, setThumbs] = useState<PageThumb[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [previewFile, setPreviewFile] = useState<File | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  useEffect(() => {
    if (!file) return
    setStatus('loading')
    setThumbs([])
    setSelected(new Set())
    setPreviewFile(null)

    renderAllPages(file, 0.6).then((urls) => {
      setThumbs(urls.map((dataUrl) => ({ dataUrl, rotation: 0 })))
      setPreviewFile(file)
      setStatus('ready')
    }).catch(() => {
      setErrorMsg('No se pudo leer el PDF.')
      setStatus('error')
    })
  }, [file])

  // Regenera el preview con las rotaciones aplicadas
  useEffect(() => {
    if (!file || thumbs.length === 0) return

    if (debounceRef.current) clearTimeout(debounceRef.current)

    debounceRef.current = setTimeout(async () => {
      const rotations: Record<number, RotationAngle> = {}
      thumbs.forEach((t, i) => {
        if (t.rotation !== 0) rotations[i] = t.rotation as RotationAngle
      })

      try {
        const bytes = await rotatePdf(file, rotations)
        const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' })
        setPreviewFile(new File([blob], file.name, { type: 'application/pdf' }))
      } catch {
        // si falla el preview silenciosamente, no bloqueamos el flujo
      }
    }, 400)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [thumbs, file])

  const togglePage = (i: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(i) ? next.delete(i) : next.add(i)
      return next
    })
  }

  const toggleAll = () => {
    setSelected((prev) =>
      prev.size === thumbs.length ? new Set() : new Set(thumbs.map((_, i) => i))
    )
  }

  const applyRotation = (angle: RotationAngle) => {
    if (selected.size === 0) return
    setThumbs((prev) =>
      prev.map((t, i) =>
        selected.has(i) ? { ...t, rotation: (t.rotation + angle) % 360 } : t
      )
    )
  }

  const handleDownload = async () => {
    if (!previewFile) return
    setStatus('processing')
    setErrorMsg('')
    try {
      const url = URL.createObjectURL(previewFile)
      const a = document.createElement('a')
      a.href = url
      a.download = file!.name.replace(/\.pdf$/i, '_rotado.pdf')
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
    setThumbs([])
    setSelected(new Set())
    setPreviewFile(null)
    setStatus('idle')
    setErrorMsg('')
  }

  const allSelected = thumbs.length > 0 && selected.size === thumbs.length
  const hasRotations = thumbs.some((t) => t.rotation !== 0)

  const panel = (
    <div className="flex flex-col h-full min-h-0 gap-3">
      {!file ? (
        <FileDropzone onFiles={(f) => setFile(f[0])} />
      ) : (
        <>
          {status === 'loading' && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Loader2 size={12} className="animate-spin" /> Generando miniaturas...
            </div>
          )}

          {(status === 'ready' || status === 'processing' || status === 'done') && (
            <>
              <div className="shrink-0 flex items-center gap-2">
                <button
                  onClick={toggleAll}
                  className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {allSelected ? <CheckSquare size={13} /> : <Square size={13} />}
                  {allSelected ? 'Deseleccionar todo' : 'Seleccionar todo'}
                </button>
                {selected.size > 0 && (
                  <span className="text-gray-700 text-xs ml-auto">{selected.size} sel.</span>
                )}
              </div>

              <div className="shrink-0 flex gap-2">
                <button
                  onClick={() => applyRotation(270)}
                  disabled={selected.size === 0}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-gray-700 text-xs text-gray-400 hover:text-gray-100 hover:border-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <RotateCcw size={13} /> 90° izq
                </button>
                <button
                  onClick={() => applyRotation(90)}
                  disabled={selected.size === 0}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-gray-700 text-xs text-gray-400 hover:text-gray-100 hover:border-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <RotateCw size={13} /> 90° der
                </button>
                <button
                  onClick={() => applyRotation(180)}
                  disabled={selected.size === 0}
                  className="flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg border border-gray-700 text-xs text-gray-400 hover:text-gray-100 hover:border-gray-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                >
                  <RotateCw size={13} /> 180°
                </button>
              </div>

              <div className="flex-1 overflow-y-auto min-h-0">
                <div className="grid grid-cols-2 gap-2 pb-2">
                  {thumbs.map((thumb, i) => (
                    <button
                      key={i}
                      onClick={() => togglePage(i)}
                      className={`relative flex flex-col items-center gap-1 p-2 rounded-lg border transition-colors ${
                        selected.has(i)
                          ? 'border-purple-500 bg-purple-500/10'
                          : 'border-gray-700 hover:border-gray-500 bg-gray-800/30'
                      }`}
                    >
                      <div className="w-full overflow-hidden rounded">
                        <img
                          src={thumb.dataUrl}
                          alt={`Página ${i + 1}`}
                          className="w-full h-auto transition-transform duration-300"
                          style={{ transform: `rotate(${thumb.rotation}deg)` }}
                        />
                      </div>
                      <span className="text-[10px] text-gray-600">p. {i + 1}</span>
                      {thumb.rotation !== 0 && (
                        <span className="absolute top-1.5 right-1.5 text-[9px] bg-purple-600 text-white rounded px-1">
                          {thumb.rotation}°
                        </span>
                      )}
                    </button>
                  ))}
                </div>
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
                    disabled={!hasRotations || status === 'processing'}
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
        Sube un PDF para ver la vista previa
      </div>
    )

  return (
    <ToolLayout
      title="Rotar páginas"
      description="Selecciona páginas y aplica la rotación. La vista previa se actualiza en tiempo real."
      panel={panel}
      preview={preview}
      previewLabel={file?.name}
    />
  )
}
