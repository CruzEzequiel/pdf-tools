import { useState } from 'react'
import type { ReactNode } from 'react'
import { FileText } from 'lucide-react'
import { useIsMobile } from '../../hooks/useDevice'

interface ToolLayoutProps {
  title: string
  description: string
  panel: ReactNode
  preview: ReactNode
  previewLabel?: string  // nombre del archivo/rango que se está mostrando
}

type Tab = 'panel' | 'preview'

export default function ToolLayout({ title, description, panel, preview, previewLabel }: ToolLayoutProps) {
  const isMobile = useIsMobile()
  const [activeTab, setActiveTab] = useState<Tab>('panel')

  if (isMobile) {
    return (
      <div className="flex flex-col h-full overflow-hidden">
        {/* Header */}
        <div className="shrink-0 mb-3">
          <h1 className="text-lg font-semibold text-gray-100">{title}</h1>
          <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        </div>

        {/* Tabs */}
        <div className="shrink-0 flex gap-1 mb-3 bg-gray-900 rounded-lg p-1">
          <button
            onClick={() => setActiveTab('panel')}
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'panel'
                ? 'bg-gray-800 text-gray-100'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Controles
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={`flex-1 py-1.5 text-sm font-medium rounded-md transition-colors ${
              activeTab === 'preview'
                ? 'bg-gray-800 text-gray-100'
                : 'text-gray-500 hover:text-gray-300'
            }`}
          >
            Vista previa
          </button>
        </div>

        {/* Contenido del tab activo */}
        <div className="flex-1 min-h-0 overflow-hidden flex flex-col">
          {activeTab === 'panel' ? (
            <div className="flex flex-col h-full min-h-0">
              {panel}
            </div>
          ) : (
            <>
              {previewLabel && (
                <div className="shrink-0 flex items-center gap-1.5 mb-2 px-1">
                  <FileText size={12} className="text-gray-600 shrink-0" />
                  <span className="text-xs text-gray-600 truncate">{previewLabel}</span>
                </div>
              )}
              <div className="flex-1 relative rounded-xl bg-gray-900/50 border border-gray-800 overflow-hidden min-h-0">
                <div className="absolute inset-0">
                  {preview}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="shrink-0 mb-4">
        <h1 className="text-xl font-semibold text-gray-100">{title}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{description}</p>
      </div>

      {/* Paneles desktop */}
      <div className="flex flex-1 gap-4 min-h-0">
        <div className="w-72 shrink-0 flex flex-col min-h-0">
          {panel}
        </div>

        <div className="w-px bg-gray-800 shrink-0" />

        <div className="flex-1 flex flex-col min-h-0 gap-2">
          {previewLabel && (
            <div className="shrink-0 flex items-center gap-1.5 px-1">
              <FileText size={12} className="text-gray-600 shrink-0" />
              <span className="text-xs text-gray-600 truncate">{previewLabel}</span>
            </div>
          )}
          <div className="flex-1 relative rounded-xl bg-gray-900/50 border border-gray-800 overflow-hidden min-h-0">
            <div className="absolute inset-0">
              {preview}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
