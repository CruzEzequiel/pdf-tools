import { useState, useEffect, useRef } from 'react'
import { Download, Loader2, Plus, X, GripVertical } from 'lucide-react'
import ToolLayout from '../../../../components/ui/ToolLayout'
import PdfViewer from '../../../../components/ui/PdfViewer'
import { imgToPdf } from '../../../../../infrastructure/useCases/imgToPdf'

type Status = 'idle' | 'processing' | 'done' | 'error'

interface ImgItem {
  file: File
  previewUrl: string
}

export default function ImgToPdfView() {
  const [images, setImages] = useState<ImgItem[]>([])
  const [previewFile, setPreviewFile] = useState<File | null>(null)
  const [status, setStatus] = useState<Status>('idle')
  const [errorMsg, setErrorMsg] = useState('')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const dragging = useRef(-1)
  const [dragOver, setDragOver] = useState(-1)

  // Limpia URLs al desmontar
  useEffect(() => {
    return () => images.forEach((img) => URL.revokeObjectURL(img.previewUrl))
  }, [])

  // Preview en tiempo real
  useEffect(() => {
    if (images.length === 0) { setPreviewFile(null); return }

    if (debounceRef.current) clearTimeout(debounceRef.current)
    debounceRef.current = setTimeout(async () => {
      try {
        const bytes = await imgToPdf(images.map((i) => i.file))
        const blob = new Blob([bytes.buffer as ArrayBuffer], { type: 'application/pdf' })
        setPreviewFile(new File([blob], 'imagenes.pdf', { type: 'application/pdf' }))
      } catch {
        setPreviewFile(null)
      }
    }, 400)

    return () => { if (debounceRef.current) clearTimeout(debounceRef.current) }
  }, [images])

  const addImages = (files: File[]) => {
    const valid = files.filter((f) => f.type === 'image/jpeg' || f.type === 'image/png')
    const existing = new Set(images.map((i) => i.file.name))
    const incoming = valid
      .filter((f) => !existing.has(f.name))
      .map((file) => ({ file, previewUrl: URL.createObjectURL(file) }))
    if (incoming.length) setImages((prev) => [...prev, ...incoming])
  }

  const remove = (index: number) => {
    setImages((prev) => {
      URL.revokeObjectURL(prev[index].previewUrl)
      return prev.filter((_, i) => i !== index)
    })
    setStatus('idle')
  }

  const move = (from: number, to: number) => {
    setImages((prev) => {
      const next = [...prev]
      const [item] = next.splice(from, 1)
      next.splice(to, 0, item)
      return next
    })
  }

  const handleDragStart = (e: React.DragEvent, i: number) => {
    e.dataTransfer.setData('text/plain', String(i))
    e.dataTransfer.effectAllowed = 'move'
    dragging.current = i
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
    setDragOver(-1)
    dragging.current = -1
  }

  const handleDragEnd = () => {
    setDragOver(-1)
    dragging.current = -1
  }

  const openPicker = () => {
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = 'image/jpeg,image/png'
    input.multiple = true
    input.onchange = (e) => {
      const files = (e.target as HTMLInputElement).files
      if (files) addImages(Array.from(files))
    }
    input.click()
  }

  const handleDownload = async () => {
    if (!previewFile) return
    setStatus('processing')
    setErrorMsg('')
    try {
      const url = URL.createObjectURL(previewFile)
      const a = document.createElement('a')
      a.href = url
      a.download = 'imagenes.pdf'
      a.click()
      URL.revokeObjectURL(url)
      setStatus('done')
    } catch (e) {
      setErrorMsg(e instanceof Error ? e.message : 'Error al generar el PDF')
      setStatus('error')
    }
  }

  const panel = (
    <div className="flex flex-col h-full min-h-0 gap-3">
      {images.length === 0 ? (
        <div
          onClick={openPicker}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault()
            addImages(Array.from(e.dataTransfer.files))
          }}
          className="flex flex-col items-center justify-center gap-3 border-2 border-dashed rounded-xl p-6 sm:p-12 cursor-pointer transition-colors border-gray-700 hover:border-gray-500 hover:bg-gray-800/30"
        >
          <Plus size={28} className="text-gray-600" />
          <p className="text-sm text-gray-400 text-center">Arrastra imágenes JPG o PNG aquí</p>
          <p className="text-xs text-gray-600">Cada imagen será una página del PDF</p>
        </div>
      ) : (
        <>
          <div className="flex-1 overflow-y-auto min-h-0">
            <ul className="flex flex-col gap-2 pb-2">
              {images.map((img, i) => {
                const isOver = dragOver === i
                const isDragging = dragging.current === i
                const insertAbove = isOver && dragging.current > i
                const insertBelow = isOver && dragging.current < i

                return (
                  <li
                    key={img.file.name}
                    draggable
                    onDragStart={(e) => handleDragStart(e, i)}
                    onDragOver={(e) => handleDragOver(e, i)}
                    onDrop={(e) => handleDrop(e, i)}
                    onDragEnd={handleDragEnd}
                    className={`relative flex items-center gap-2 px-2 py-2 rounded-lg border cursor-grab transition-all duration-150
                      ${isDragging ? 'opacity-40 scale-[0.98] border-gray-600 bg-gray-800/60' : 'border-gray-700 bg-gray-800/30 hover:border-gray-500'}
                      ${insertAbove ? 'translate-y-1' : ''}
                      ${insertBelow ? '-translate-y-1' : ''}
                    `}
                  >
                    {insertAbove && <span className="absolute -top-1.5 left-0 right-0 h-0.5 rounded-full bg-purple-500" />}

                    <GripVertical size={14} className="text-gray-600 shrink-0" />

                    <div className="w-10 h-12 rounded overflow-hidden bg-gray-900 shrink-0">
                      <img src={img.previewUrl} alt="" className="w-full h-full object-cover" />
                    </div>

                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-300 truncate">{img.file.name}</p>
                      <p className="text-[10px] text-gray-600">p. {i + 1}</p>
                    </div>

                    <button
                      onClick={() => remove(i)}
                      className="shrink-0 text-gray-600 hover:text-red-400 transition-colors"
                    >
                      <X size={14} />
                    </button>

                    {insertBelow && <span className="absolute -bottom-1.5 left-0 right-0 h-0.5 rounded-full bg-purple-500" />}
                  </li>
                )
              })}
            </ul>
          </div>

          <button
            onClick={openPicker}
            className="shrink-0 flex items-center gap-2 text-xs text-gray-600 hover:text-purple-400 transition-colors self-start px-1"
          >
            <Plus size={13} /> Agregar más imágenes
          </button>

          <div className="shrink-0 flex flex-col gap-2 pt-2 border-t border-gray-800">
            {status === 'done' && <p className="text-xs text-green-400">Descargado correctamente.</p>}
            {status === 'error' && <p className="text-xs text-red-400">{errorMsg}</p>}
            <button
              onClick={handleDownload}
              disabled={images.length === 0 || status === 'processing' || !previewFile}
              className="flex items-center justify-center gap-2 w-full px-4 py-2.5 rounded-lg bg-purple-600 hover:bg-purple-500 disabled:opacity-40 disabled:cursor-not-allowed text-white text-sm font-medium transition-colors"
            >
              {status === 'processing'
                ? <><Loader2 size={15} className="animate-spin" /> Generando...</>
                : <><Download size={15} /> Descargar PDF</>
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
        Agrega imágenes para ver el resultado
      </div>
    )

  return (
    <ToolLayout
      title="Imagen a PDF"
      description="Convierte imágenes JPG o PNG a PDF. Arrastra para reordenar."
      panel={panel}
      preview={preview}
      previewLabel={images.length > 0 ? `${images.length} imagen${images.length !== 1 ? 'es' : ''} → PDF` : undefined}
    />
  )
}
