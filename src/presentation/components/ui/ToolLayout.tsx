import type { ReactNode } from 'react'

interface ToolLayoutProps {
  title: string
  description: string
  panel: ReactNode      // panel izquierdo: lista + acciones
  preview: ReactNode    // panel derecho: vista previa
}

export default function ToolLayout({ title, description, panel, preview }: ToolLayoutProps) {
  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0 mb-4">
        <h1 className="text-xl font-semibold text-gray-100">{title}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{description}</p>
      </div>

      {/* Paneles */}
      <div className="flex flex-1 gap-4 min-h-0">
        {/* Panel izquierdo: la lista scrollea, el botón queda fijo abajo */}
        <div className="w-72 shrink-0 flex flex-col min-h-0">
          {panel}
        </div>

        {/* Divisor */}
        <div className="w-px bg-gray-800 shrink-0" />

        {/* Panel derecho — preview con scroll interno */}
        <div className="flex-1 relative rounded-xl bg-gray-900/50 border border-gray-800 overflow-hidden">
          <div className="absolute inset-0">
            {preview}
          </div>
        </div>
      </div>
    </div>
  )
}
