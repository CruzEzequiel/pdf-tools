import { useEffect, useRef, useState, useCallback } from 'react'
import { pdfjsLib } from '../../../infrastructure/services/pdfWorker'
import { Loader2 } from 'lucide-react'

interface PdfViewerProps {
  file: File
}

export default function PdfViewer({ file }: PdfViewerProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const [pages, setPages] = useState<pdfjsLib.PDFPageProxy[]>([])
  const [containerWidth, setContainerWidth] = useState(0)
  const [loading, setLoading] = useState(true)
  const [currentPage, setCurrentPage] = useState(1)
  const pageRefs = useRef<(HTMLDivElement | null)[]>([])

  useEffect(() => {
    setLoading(true)
    setPages([])
    setCurrentPage(1)
    let cancelled = false

    file.arrayBuffer().then((buffer) => {
      pdfjsLib.getDocument({ data: buffer }).promise.then((pdf) => {
        if (cancelled) return
        Promise.all(
          Array.from({ length: pdf.numPages }, (_, i) => pdf.getPage(i + 1))
        ).then((loaded) => {
          if (!cancelled) { setPages(loaded); setLoading(false) }
        })
      })
    })

    return () => { cancelled = true }
  }, [file])

  useEffect(() => {
    if (!containerRef.current) return
    const ro = new ResizeObserver(([entry]) => setContainerWidth(entry.contentRect.width))
    ro.observe(containerRef.current)
    return () => ro.disconnect()
  }, [])

  // Detecta qué página es la más visible con IntersectionObserver
  useEffect(() => {
    if (pages.length === 0) return
    const ratios = new Array(pages.length).fill(0)

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const i = pageRefs.current.indexOf(entry.target as HTMLDivElement)
          if (i !== -1) ratios[i] = entry.intersectionRatio
        })
        const max = ratios.indexOf(Math.max(...ratios))
        if (max !== -1) setCurrentPage(max + 1)
      },
      { root: containerRef.current, threshold: Array.from({ length: 11 }, (_, i) => i / 10) }
    )

    pageRefs.current.forEach((el) => { if (el) observer.observe(el) })
    return () => observer.disconnect()
  }, [pages])

  const setPageRef = useCallback((el: HTMLDivElement | null, i: number) => {
    pageRefs.current[i] = el
  }, [])

  return (
    <div className="relative w-full h-full">
      {/* Área scrolleable */}
      <div ref={containerRef} className="w-full h-full overflow-y-auto bg-gray-900 rounded-xl">
        {loading && (
          <div className="flex items-center justify-center h-full gap-2 text-gray-600">
            <Loader2 size={20} className="animate-spin" />
            <span className="text-sm">Cargando...</span>
          </div>
        )}

        {!loading && containerWidth > 0 && (
          <div className="flex flex-col items-center gap-4 py-6 px-4">
            {pages.map((page, i) => (
              <div key={i} ref={(el) => setPageRef(el, i)}>
                <PageCanvas page={page} containerWidth={containerWidth - 32} />
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Badge flotante — fuera del scroll, sobre el contenedor */}
      {!loading && pages.length > 0 && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/70 backdrop-blur-sm text-xs text-gray-300 pointer-events-none select-none z-10">
          {currentPage} / {pages.length}
        </div>
      )}
    </div>
  )
}

function PageCanvas({ page, containerWidth }: { page: pdfjsLib.PDFPageProxy; containerWidth: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const renderTaskRef = useRef<pdfjsLib.RenderTask | null>(null)

  useEffect(() => {
    if (!canvasRef.current || containerWidth <= 0) return

    // Cancela render previo antes de iniciar uno nuevo
    if (renderTaskRef.current) {
      renderTaskRef.current.cancel()
      renderTaskRef.current = null
    }

    const dpr = window.devicePixelRatio || 1
    const baseViewport = page.getViewport({ scale: 1 })
    const scale = (containerWidth / baseViewport.width) * dpr
    const viewport = page.getViewport({ scale })

    const canvas = canvasRef.current
    canvas.width = viewport.width
    canvas.height = viewport.height
    canvas.style.width = `${containerWidth}px`
    canvas.style.height = `${viewport.height / dpr}px`

    const task = page.render({ canvasContext: canvas.getContext('2d')!, viewport })
    renderTaskRef.current = task

    task.promise.catch((err) => {
      if (err?.name !== 'RenderingCancelledException') console.error(err)
    }).finally(() => {
      renderTaskRef.current = null
    })

    return () => {
      task.cancel()
      renderTaskRef.current = null
    }
  }, [page, containerWidth])

  return <canvas ref={canvasRef} className="rounded shadow-lg shadow-black/40 bg-white" />
}
