import { useEffect, useState, useRef } from 'react'
import { GripVertical, X, FileText } from 'lucide-react'
import { renderPageToDataUrl } from '../../../../../../infrastructure/services/pdfRenderer'

interface FileItem {
  file: File
  thumb: string | null
}

interface FileListProps {
  files: File[]
  selected: number
  onSelect: (index: number) => void
  onRemove: (index: number) => void
  onMove: (from: number, to: number) => void
}

export default function FileList({ files, selected, onSelect, onRemove, onMove }: FileListProps) {
  const [items, setItems] = useState<FileItem[]>([])
  const [dragging, setDragging] = useState(-1)
  const [dragOver, setDragOver] = useState(-1)
  const dragIndex = useRef(-1)

  useEffect(() => {
    setItems(files.map((file) => ({ file, thumb: null })))
    files.forEach((file, i) => {
      renderPageToDataUrl(file, 1, 0.8).then((thumb) => {
        setItems((prev) => {
          const next = [...prev]
          if (next[i]) next[i] = { ...next[i], thumb }
          return next
        })
      })
    })
  }, [files])

  const handleDragStart = (i: number) => {
    dragIndex.current = i
    setDragging(i)
  }

  const handleDragOver = (e: React.DragEvent, i: number) => {
    e.preventDefault()
    if (i !== dragIndex.current) setDragOver(i)
  }

  const handleDrop = (i: number) => {
    if (dragIndex.current !== -1 && dragIndex.current !== i) {
      onMove(dragIndex.current, i)
    }
    setDragging(-1)
    setDragOver(-1)
    dragIndex.current = -1
  }

  const handleDragEnd = () => {
    setDragging(-1)
    setDragOver(-1)
    dragIndex.current = -1
  }

  return (
    <ul className="flex flex-col gap-2">
      {items.map((item, i) => {
        const isDragging = dragging === i
        const isOver = dragOver === i
        const insertAbove = isOver && dragging > i
        const insertBelow = isOver && dragging < i

        return (
          <li
            key={`${item.file.name}-${i}`}
            draggable
            onClick={() => !isDragging && onSelect(i)}
            onDragStart={() => handleDragStart(i)}
            onDragOver={(e) => handleDragOver(e, i)}
            onDrop={() => handleDrop(i)}
            onDragEnd={handleDragEnd}
            className={`relative flex items-center gap-2 px-3 py-2 rounded-lg border cursor-pointer
              transition-all duration-150
              ${insertAbove ? 'translate-y-1' : ''}
              ${insertBelow ? '-translate-y-1' : ''}
              ${isDragging
                ? 'opacity-40 scale-[0.98] border-gray-600 bg-gray-800/60'
                : selected === i
                  ? 'border-purple-500 bg-purple-500/10'
                  : 'border-gray-700 bg-gray-800/60 hover:border-gray-600'
              }`}
          >
            {/* Línea indicadora arriba */}
            {insertAbove && (
              <span className="absolute -top-1.5 left-0 right-0 h-0.5 rounded-full bg-purple-500" />
            )}

            <GripVertical size={14} className="text-gray-600 shrink-0 cursor-grab" />

            <div className="w-8 h-10 rounded overflow-hidden bg-gray-900 shrink-0 flex items-center justify-center">
              {item.thumb
                ? <img src={item.thumb} alt="" className="w-full h-full object-cover" />
                : <FileText size={14} className="text-gray-600" />
              }
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-xs text-gray-300 truncate">{item.file.name}</p>
              <p className="text-[10px] text-gray-600">{(item.file.size / 1024 / 1024).toFixed(1)} MB</p>
            </div>

            <button
              onClick={(e) => { e.stopPropagation(); onRemove(i) }}
              className="shrink-0 text-gray-600 hover:text-red-400 transition-colors"
            >
              <X size={14} />
            </button>

            {/* Línea indicadora abajo */}
            {insertBelow && (
              <span className="absolute -bottom-1.5 left-0 right-0 h-0.5 rounded-full bg-purple-500" />
            )}
          </li>
        )
      })}
    </ul>
  )
}
