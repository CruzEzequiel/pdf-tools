import { Construction } from 'lucide-react'

export default function CompressView() {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-4 text-center">
      <Construction size={40} className="text-gray-700" />
      <h1 className="text-2xl font-semibold text-gray-300">Comprimir PDF</h1>
      <p className="text-gray-500 max-w-sm">Reduce el tamaño del archivo PDF manteniendo la calidad.</p>
      <span className="text-xs border border-gray-700 text-gray-600 rounded px-2 py-1">Requiere backend Python</span>
    </div>
  )
}
