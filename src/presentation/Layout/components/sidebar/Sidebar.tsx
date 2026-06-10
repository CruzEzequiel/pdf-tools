import { Link, useLocation } from 'react-router-dom'
import * as Icons from 'lucide-react'
import { navGroups } from './navItems'

export default function Sidebar() {
  const { pathname } = useLocation()

  return (
    <aside className="w-56 shrink-0 border-r border-gray-800 flex flex-col py-6 gap-6 overflow-y-auto">
      {navGroups.map((group) => (
        <div key={group.category}>
          <p className="px-4 mb-1 text-[11px] font-semibold uppercase tracking-widest text-gray-600">
            {group.label}
          </p>
          <ul>
            {group.items.map((item) => {
              const Icon = (Icons as Record<string, Icons.LucideIcon>)[item.icon] ?? Icons.File
              const isActive = pathname === item.path
              const isComingSoon = item.status === 'backend-required'

              return (
                <li key={item.path}>
                  <Link
                    to={item.path}
                    className={`flex items-center gap-3 px-4 py-2 text-sm transition-colors rounded-none
                      ${isActive
                        ? 'bg-gray-800 text-purple-400'
                        : isComingSoon
                          ? 'text-gray-600 cursor-not-allowed pointer-events-none'
                          : 'text-gray-400 hover:text-gray-100 hover:bg-gray-800/50'
                      }`}
                  >
                    <Icon size={16} />
                    <span className="flex-1">{item.label}</span>
                    {isComingSoon && (
                      <span className="text-[10px] text-gray-600 border border-gray-700 rounded px-1">
                        soon
                      </span>
                    )}
                  </Link>
                </li>
              )
            })}
          </ul>
        </div>
      ))}
    </aside>
  )
}
