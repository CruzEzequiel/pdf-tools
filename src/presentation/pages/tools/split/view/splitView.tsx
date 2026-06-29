import { useState, useEffect, useRef } from 'react'
import { Download, Loader2, FileText } from 'lucide-react'
import FileDropzone from '../../../../components/ui/FileDropzone'
import RangeList from './components/RangeList'
import ToolLayout from '../../../../components/ui/ToolLayout'
import PdfViewer from '../../../../components/ui/PdfViewer'
import { splitPdf, getPdfPageCount } from '../../../../../infrastructure/useCases/splitPdf'
import type { SplitRange } from '../../../../../infrastructure/useCases/splitPdf'

type Status = 'idle' | 'loading' | 'ready' | 'processing' | 'done' | 'error'

export default function SplitView() {
  const [file, setFile] = useState<File | null>(null)
  const [totalPages, setTotalPages] = useState(0)
  const [ranges, setRanges] = useState<SplitRange[]>([])
  const [selectedRange, setSelectedRange] = useState(0)
  const [previewFile, setPreviewFile] = useState<File | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const previewDebounce = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Genera preview del rango seleccionado al vuelo
  useEffect(() => {
    if (!file || ranges.length === 0) { setPreviewFile(null); return }

    if (previewDebounce.current) clearTimeout(previewDebounce.current)

    previewDebounce.current = setTimeout(async () => {
      const range = ranges[selectedRange]
      if (!range) return
      try {
        const [result] = await splitPdf(file, [{ ...range, name: 'preview' }])
        const blob = new Blob([result.bytes.buffer as ArrayBuffer], { type: 'application/pdf' })
        setPreviewFile(new File([blob], 'preview.pdf', { type: 'application/pdf' }))
      } catch {
        setPreviewFile(null)
      }
    }, 400)

    return () => { if (previewDebounce.current) clearTimeout(previewDebounce.current) }
  }, [file, ranges, selectedRange])

  const handleFile = async (files: File[]) => {
    const f = files[0]
    setFile(f)
    setStatus('loading')
    setErrorMsg('')
    try {
      const count = await getPdfPageCount(f)
      setTotalPages(count)
      setRanges([{ from: 1, to: count, name: 'parte-1.pdf' }])
      setSelectedRange(0)
      setStatus('ready')
    } catch {
      setErrorMsg('No se pudo leer el PDF.')
      setStatus('error')
    }
  }

  const handleRangesChange = (next: SplitRange[]) => {
    setRanges(next)
    setSelectedRange((s) => Math.min(s, next.length - 1))
  }

  const handleSplit = async () => {
    if (!file || ranges.length === 0) return
    setStatus('processing')
    setErrorMsg('')
    try {
      const results = await splitPdf(file, ranges)
      for (const result of results) {
        const blob = new Blob([result.bytes.buffer as ArrayBuffer], { type: 'application/pdf' })
        const url = URL.createObjectURL(blob)
        const a = document.createElement('a')
        a.href = url
        a.download = result.name.endsWith('.pdf') ? result.name : `${result.name}.pdf`
        a.click()
        URL.revokeObjectURL(url)
      }
      setStatus('done')
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Error al dividir el PDF')
      setStatus('error')
    }
  }

  const reset = () => {
    setFile(null); setTotalPages(0); setRanges([])
    setSelectedRange(0); setPreviewFile(null)
    setStatus('idle'); setErrorMsg('')
  }

  const panel = (
    <div className="flex flex-col h-full min-h-0 gap-3">
      {!file ? (
        <FileDropzone onFiles={handleFile} />
      ) : (
        <>
          {/* Archivo cargado */}
          <div className="shrink-0 flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-800/60 border border-gray-700">
            <FileText size={14} className="text-purple-400 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-300 truncate">{file.name}</p>
              {totalPages > 0 && (
                <p className="text-[10px] text-gray-600">{totalPages} páginas</p>
              )}
            </div>
            <button onClick={reset} className="text-[10px] text-gray-600 hover:text-gray-400 transition-colors shrink-0">
              Cambiar
            </button>
          </div>

          {status === 'loading' && (
            <div className="flex items-center gap-2 text-xs text-gray-500">
              <Loader2 size={12} className="animate-spin" /> Leyendo PDF...
            </div>
          )}

          {(status === 'ready' || status === 'processing' || status === 'done' || status === 'error') && (
            <>
              <div className="flex-1 overflow-y-auto min-h-0">
                <RangeList
                  ranges={ranges}
                  totalPages={totalPages}
                  selected={selectedRange}
                  onSelect={setSelectedRange}
                  onChange={handleRangesChange}
                />
              </div>

              <div className="shrink-0 flex flex-col gap-2 pt-2 border-t border-gray-800">
                {status === 'done' && (
                  <p className="text-xs text-green-400">
                    {ranges.length} archivo{ranges.length !== 1 ? 's' : ''} descargado{ranges.length !== 1 ? 's' : ''}.
                  </p>
                )}
                {status === 'error' && <p className="text-xs text-red-400">{errorMsg}</p>}
                <button
                  onClick={handleSplit}
                  disabled={status === 'processing'}
                  className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
                >
                  {status === 'processing'
                    ? <><Loader2 size={15} className="animate-spin" /> Procesando...</>
                    : <><Download size={15} /> Dividir y descargar</>
                  }
                </button>
              </div>
            </>
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

  const selectedRangeName = ranges[selectedRange]
    ? `${file?.name} — páginas ${ranges[selectedRange].from}–${ranges[selectedRange].to}`
    : undefined

  return (
    <ToolLayout
      title="Dividir PDF"
      description="Define rangos de páginas. Haz clic en un rango para previsualizarlo."
      panel={panel}
      preview={preview}
      previewLabel={selectedRangeName}
    />
  )
}
