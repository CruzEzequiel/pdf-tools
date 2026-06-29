import { Link } from 'react-router-dom'
import * as Icons from 'lucide-react'
import { navGroups } from '../../../../Layout/components/sidebar/navItems'

export default function HomeView() {
  return (
    <div className="max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold text-gray-100 mb-2">PDF Tools</h1>
      <p className="text-gray-400 mb-10">Todas las herramientas que necesitás para trabajar con PDFs.</p>

      <div className="flex flex-col gap-8">
        {navGroups.map((group) => (
          <div key={group.category}>
            <h2 className="text-xs font-semibold uppercase tracking-widest text-gray-600 mb-3">
              {group.label}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {group.items.map((item) => {
                const Icon = (Icons as unknown as Record<string, Icons.LucideIcon>)[item.icon] ?? Icons.File
                const isComingSoon = item.status === 'backend-required'

                return (
                  <Link
                    key={item.path}
                    to={item.path}
                    className={`flex items-center gap-3 p-4 rounded-lg border transition-colors
                      ${isComingSoon
                        ? 'border-gray-800 text-gray-600 pointer-events-none'
                        : 'border-gray-800 text-gray-300 hover:border-purple-500/50 hover:bg-gray-800/50 hover:text-gray-100'
                      }`}
                  >
                    <Icon size={18} className={isComingSoon ? 'text-gray-700' : 'text-purple-400'} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{item.label}</p>
                      {isComingSoon && (
                        <p className="text-[11px] text-gray-600">Requiere backend</p>
                      )}
                    </div>
                  </Link>
                )
              })}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
