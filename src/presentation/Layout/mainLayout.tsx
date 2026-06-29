import { useState } from 'react'
import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { FileText, Menu, X, ShieldCheck } from 'lucide-react'
import Sidebar from './components/sidebar/Sidebar'
import { useIsMobile } from '../hooks/useDevice'

interface PageLayoutProps {
  children: ReactNode
}

export default function PageLayout({ children }: PageLayoutProps) {
  const isMobile = useIsMobile()
  const [drawerOpen, setDrawerOpen] = useState(false)

  return (
    <div className="min-h-screen flex flex-col bg-gray-950 text-gray-100">
      <header className="h-14 border-b border-gray-800 flex items-center px-4 shrink-0 gap-3">
        {isMobile && (
          <button
            onClick={() => setDrawerOpen(true)}
            className="p-1.5 rounded-lg text-gray-400 hover:text-gray-100 hover:bg-gray-800 transition-colors"
            aria-label="Abrir menú"
          >
            <Menu size={20} />
          </button>
        )}
        <Link to="/" className="flex items-center gap-2 text-purple-400 font-semibold">
          <FileText size={20} />
          PDF Tools
        </Link>

        <div className="ml-auto flex items-center gap-1.5 text-[11px] text-gray-600">
          <ShieldCheck size={13} className="text-green-600 shrink-0" />
          {isMobile ? 'Procesado en tu dispositivo' : 'Todo se procesa en tu dispositivo — no recopilamos ni enviamos tus archivos'}
        </div>
      </header>

      <div className="flex flex-1 overflow-hidden">
        {/* Sidebar desktop */}
        {!isMobile && <Sidebar />}

        {/* Drawer móvil — overlay */}
        {isMobile && (
          <>
            {/* Backdrop */}
            <div
              className={`fixed inset-0 z-40 bg-black/60 backdrop-blur-sm transition-opacity duration-300 ${
                drawerOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'
              }`}
              onClick={() => setDrawerOpen(false)}
            />

            {/* Panel deslizable */}
            <div
              className={`fixed top-0 left-0 z-50 h-full w-64 bg-gray-950 border-r border-gray-800 flex flex-col transition-transform duration-300 ${
                drawerOpen ? 'translate-x-0' : '-translate-x-full'
              }`}
            >
              <div className="h-14 flex items-center px-4 border-b border-gray-800 shrink-0 gap-3">
                <button
                  onClick={() => setDrawerOpen(false)}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-gray-100 hover:bg-gray-800 transition-colors"
                  aria-label="Cerrar menú"
                >
                  <X size={20} />
                </button>
                <span className="text-purple-400 font-semibold text-sm flex items-center gap-2">
                  <FileText size={18} />
                  PDF Tools
                </span>
              </div>
              <div className="flex-1 overflow-y-auto">
                <Sidebar onNavigate={() => setDrawerOpen(false)} borderless />
              </div>
            </div>
          </>
        )}

        <main className={`flex-1 overflow-hidden ${isMobile ? 'p-4' : 'p-8'}`}>
          {children}
        </main>
      </div>
    </div>
  )
}
