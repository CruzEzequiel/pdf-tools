import { Loader2 } from 'lucide-react'

interface Page {
  thumb: string
  label: string
}

interface PdfPreviewGridProps {
  pages: Page[]
  loading: boolean
  emptyMessage?: string
}

export default function PdfPreviewGrid({ pages, loading, emptyMessage }: PdfPreviewGridProps) {
  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-full gap-3 text-gray-600">
        <Loader2 size={28} className="animate-spin" />
        <span className="text-sm">Generando vista previa...</span>
      </div>
    )
  }

  if (pages.length === 0) {
    return (
      <div className="flex items-center justify-center h-full text-sm text-gray-700">
        {emptyMessage ?? 'Agrega archivos para ver la vista previa'}
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 gap-3 p-4 overflow-y-auto">
      {pages.map((page, i) => (
        <div key={i} className="flex flex-col items-center gap-1">
          <div className="w-full rounded border border-gray-700 overflow-hidden bg-gray-900">
            <img src={page.thumb} alt={page.label} className="w-full h-auto" />
          </div>
          <span className="text-[10px] text-gray-600">{page.label}</span>
        </div>
      ))}
    </div>
  )
}
