import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { FileText } from 'lucide-react'
import Sidebar from './components/sidebar/Sidebar'

interface PageLayoutProps {
  children: ReactNode
}

export default function PageLayout({ children }: PageLayoutProps) {
  return (
    <div className="min-h-screen flex flex-col bg-gray-950 text-gray-100">
      <header className="h-14 border-b border-gray-800 flex items-center px-6 shrink-0">
        <Link to="/" className="flex items-center gap-2 text-purple-400 font-semibold">
          <FileText size={20} />
          PDF Tools
        </Link>
      </header>

      <div className="flex flex-1 overflow-hidden">
        <Sidebar />
        <main className="flex-1 overflow-hidden p-8">
          {children}
        </main>
      </div>
    </div>
  )
}
