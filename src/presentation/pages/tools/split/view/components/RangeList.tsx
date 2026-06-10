import { Plus, Trash2 } from 'lucide-react'
import type { SplitRange } from '../../../../../../infrastructure/useCases/splitPdf'

interface RangeListProps {
  ranges: SplitRange[]
  totalPages: number
  selected: number
  onSelect: (index: number) => void
  onChange: (ranges: SplitRange[]) => void
}

export default function RangeList({ ranges, totalPages, selected, onSelect, onChange }: RangeListProps) {
  const add = () => {
    const last = ranges[ranges.length - 1]
    const from = last ? Math.min(last.to + 1, totalPages) : 1
    const next = [...ranges, { from, to: totalPages, name: `parte-${ranges.length + 1}.pdf` }]
    onChange(next)
    onSelect(next.length - 1)
  }

  const update = (index: number, field: keyof SplitRange, value: string | number) => {
    onChange(ranges.map((r, i) => i === index ? { ...r, [field]: value } : r))
  }

  const updatePage = (index: number, field: 'from' | 'to', raw: string) => {
    const n = parseInt(raw, 10)
    if (isNaN(n)) return
    const clamped = Math.min(Math.max(1, n), totalPages)
    update(index, field, clamped)
  }

  const remove = (index: number) => {
    onChange(ranges.filter((_, i) => i !== index))
  }

  return (
    <div className="flex flex-col gap-2">
      {ranges.map((range, i) => {
        const pageCount = Math.max(0, range.to - range.from + 1)
        return (
          <div
            key={i}
            onClick={() => onSelect(i)}
            className={`flex flex-col gap-2.5 p-3 rounded-lg border cursor-pointer transition-colors
              ${selected === i
                ? 'border-purple-500 bg-purple-500/10'
                : 'border-gray-700 bg-gray-800/60 hover:border-gray-600'
              }`}
          >
            {/* Nombre */}
            <div className="flex items-center gap-2">
              <span className="text-[10px] text-gray-600 w-4 shrink-0 tabular-nums">{i + 1}</span>
              <input
                type="text"
                value={range.name}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => update(i, 'name', e.target.value)}
                placeholder="nombre.pdf"
                className="flex-1 bg-transparent text-xs text-gray-300 placeholder-gray-600 outline-none border-b border-transparent focus:border-gray-600 transition-colors min-w-0 pb-0.5"
              />
              <button
                onClick={(e) => { e.stopPropagation(); remove(i) }}
                disabled={ranges.length === 1}
                className="shrink-0 text-gray-700 hover:text-red-400 disabled:opacity-20 disabled:cursor-not-allowed transition-colors"
              >
                <Trash2 size={12} />
              </button>
            </div>

            {/* Rango de páginas */}
            <div className="flex items-center gap-1.5 pl-6">
              <span className="text-[10px] text-gray-600">pág.</span>
              <input
                type="text"
                inputMode="numeric"
                value={range.from}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => updatePage(i, 'from', e.target.value)}
                className="w-8 bg-transparent text-xs text-gray-300 text-center outline-none border-b border-gray-700 focus:border-purple-500 transition-colors tabular-nums [appearance:textfield] pb-0.5"
              />
              <span className="text-[10px] text-gray-600">—</span>
              <input
                type="text"
                inputMode="numeric"
                value={range.to}
                onClick={(e) => e.stopPropagation()}
                onChange={(e) => updatePage(i, 'to', e.target.value)}
                className="w-8 bg-transparent text-xs text-gray-300 text-center outline-none border-b border-gray-700 focus:border-purple-500 transition-colors tabular-nums pb-0.5"
              />
              <span className="text-[10px] text-gray-600 ml-1">
                · {pageCount} pág{pageCount !== 1 ? 's' : ''}
              </span>
            </div>
          </div>
        )
      })}

      <button
        onClick={add}
        className="flex items-center gap-1.5 text-xs text-gray-600 hover:text-purple-400 transition-colors self-start pt-1"
      >
        <Plus size={12} /> Agregar rango
      </button>
    </div>
  )
}
