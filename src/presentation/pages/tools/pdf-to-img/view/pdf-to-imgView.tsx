import { useState, useEffect, useRef } from 'react'
import { Download, Loader2 } from 'lucide-react'
import FileDropzone from '../../../../components/ui/FileDropzone'
import ToolLayout from '../../../../components/ui/ToolLayout'
import PdfViewer from '../../../../components/ui/PdfViewer'
import { renderAllPages } from '../../../../../infrastructure/services/pdfRenderer'
import { pdfPageToPng } from '../../../../../infrastructure/useCases/pdfToImg'
import { extractPages } from '../../../../../infrastructure/useCases/extractPages'

type Status = 'idle' | 'loading' | 'ready' | 'downloading' | 'done' | 'error'

export default function PdfToImgView() {
  const [file, setFile] = useState<File | null>(null)
  const [thumbs, setThumbs] = useState<string[]>([])
  const [selected, setSelected] = useState<Set<number>>(new Set())
  const [previewFile, setPreviewFile] = useState<File | null>(null)
  const [downloading, setDownloading] = useState<Set<number>>(new Set())
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
      setThumbs(urls)
      setStatus('ready')
    }).catch(() => {
      setErrorMsg('No se pudo leer el PDF.')
      setStatus('error')
    })
  }, [file])

  // Preview PDF con solo las páginas seleccionadas
  useEffect(() => {
    if (!file || selected.size === 0) { setPreviewFile(null); return }

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const pages = [...selected].sort((a, b) => a - b)
        const bytes = await extractPages(file, pages)
        const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' })
        setPreviewFile(new File([blob], 'seleccion.pdf', { type: 'application/pdf' }))
      } catch {
        setPreviewFile(null)
      }
    }, 400)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [selected, file])

  const togglePage = (page: number) => {
    setSelected((prev) => {
      const next = new Set(prev)
      next.has(page) ? next.delete(page) : next.add(page)
      return next
    })
  }

  const toggleAll = () => {
    setSelected((prev) =>
      prev.size === thumbs.length ? new Set() : new Set(thumbs.map((_, i) => i + 1))
    )
  }

  const downloadSelected = async () => {
    if (!file || selected.size === 0) return
    setStatus('downloading')
    setErrorMsg('')
    try {
      for (const page of [...selected].sort((a, b) => a - b)) {
        setDownloading((prev) => new Set(prev).add(page))
        const blob = await pdfPageToPng(file, page)
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = `${file.name.replace(/\.pdf$/i, '')}_p${page}.png`
        a.click()
        URL.revokeObjectURL(url)
        setDownloading((prev) => { const next = new Set(prev); next.delete(page); return next })
      }
      setStatus('done')
    } catch {
      setErrorMsg('Error al exportar imágenes')
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
  const sortedSelected = [...selected].sort((a, b) => a - b)

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

          {(status === 'ready' || status === 'downloading' || status === 'done') && (
            <>
              <div className="shrink-0 flex items-center justify-between">
                <button
                  onClick={toggleAll}
                  className="text-xs text-gray-500 hover:text-gray-300 transition-colors"
                >
                  {allSelected ? 'Deseleccionar todo' : 'Seleccionar todo'}
                </button>
                {selected.size > 0 && (
                  <span className="text-xs text-gray-600">{selected.size} sel.</span>
                )}
              </div>

              <div className="flex-1 overflow-y-auto min-h-0">
                <div className="grid grid-cols-2 gap-2 pb-2">
                  {thumbs.map((thumb, i) => {
                    const page = i + 1
                    const isSelected = selected.has(page)
                    const isDownloading = downloading.has(page)

                    return (
                      <button
                        key={i}
                        onClick={() => togglePage(page)}
                        className={`relative flex flex-col items-center gap-1 p-2 rounded-lg border transition-colors ${
                          isSelected
                            ? 'border-purple-500 bg-purple-500/10'
                            : 'border-gray-700 hover:border-gray-500 bg-gray-800/30'
                        }`}
                      >
                        <img src={thumb} alt={`Página ${page}`} className="w-full h-auto rounded" />
                        <span className="text-[10px] text-gray-600">p. {page}</span>
                        {isDownloading && (
                          <span className="absolute inset-0 flex items-center justify-center bg-gray-900/60 rounded-lg">
                            <Loader2 size={16} className="animate-spin text-purple-400" />
                          </span>
                        )}
                        {isSelected && !isDownloading && (
                          <span className="absolute top-1.5 right-1.5 w-4 h-4 rounded-full bg-purple-600 flex items-center justify-center text-[9px] text-white font-bold">
                            {sortedSelected.indexOf(page) + 1}
                          </span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="shrink-0 flex flex-col gap-2 pt-2 border-t border-gray-800">
                {status === 'done' && <p className="text-xs text-green-400">Imágenes descargadas.</p>}
                {status === 'error' && <p className="text-xs text-red-400">{errorMsg}</p>}
                <div className="flex gap-2">
                  <button
                    onClick={reset}
                    className="px-3 py-2 rounded-lg border border-gray-700 text-xs text-gray-500 hover:text-gray-300 hover:border-gray-500 transition-colors"
                  >
                    Cambiar PDF
                  </button>
                  <button
                    onClick={downloadSelected}
                    disabled={selected.size === 0 || status === 'downloading'}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
                  >
                    {status === 'downloading'
                      ? <><Loader2 size={14} className="animate-spin" /> Exportando...</>
                      : <><Download size={14} /> Exportar PNG{selected.size > 1 ? 's' : ''} {selected.size > 0 ? `(${selected.size})` : ''}</>
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
        {file ? 'Selecciona páginas para previsualizar' : 'Sube un PDF para comenzar'}
      </div>
    )

  const previewLabel = selected.size > 0
    ? `Páginas seleccionadas: ${sortedSelected.join(', ')}`
    : file?.name

  return (
    <ToolLayout
      title="PDF a imagen"
      description="Selecciona las páginas que quieres exportar. Cada una se descarga como PNG."
      panel={panel}
      preview={preview}
      previewLabel={previewLabel}
    />
  )
}
