import type { ToolCategory } from '../../../../domain/entities/db/public/tool'

export interface NavItem {
  label: string
  path: string
  icon: string
  status: 'available' | 'backend-required'
}

export interface NavGroup {
  category: ToolCategory
  label: string
  items: NavItem[]
}

export const navGroups: NavGroup[] = [
  {
    category: 'organize',
    label: 'Organizar',
    items: [
      { label: 'Unir PDFs',       path: '/merge',   icon: 'Combine',    status: 'available' },
      { label: 'Dividir PDF',     path: '/split',   icon: 'Scissors',   status: 'available' },
      { label: 'Extraer páginas', path: '/extract', icon: 'FileOutput', status: 'available' },
      { label: 'Reordenar',       path: '/reorder', icon: 'GripVertical', status: 'available' },
    ],
  },
  {
    category: 'edit',
    label: 'Editar',
    items: [
      { label: 'Rotar páginas',   path: '/rotate',    icon: 'RotateCw',    status: 'available' },
      { label: 'Marca de agua',   path: '/watermark', icon: 'Droplets',    status: 'available' },
      { label: 'Comprimir',       path: '/compress',  icon: 'PackageOpen', status: 'backend-required' },
    ],
  },
  {
    category: 'convert',
    label: 'Convertir',
    items: [
      { label: 'Imagen a PDF',    path: '/img-to-pdf', icon: 'ImagePlus',   status: 'available' },
      { label: 'PDF a imagen',    path: '/pdf-to-img', icon: 'Image',       status: 'available' },
      { label: 'PDF a Word',      path: '/pdf-to-word', icon: 'FileText',   status: 'backend-required' },
    ],
  },
  {
    category: 'security',
    label: 'Seguridad',
    items: [
      { label: 'Proteger PDF',    path: '/protect',  icon: 'Lock',        status: 'available' },
      { label: 'Desbloquear PDF', path: '/unlock',   icon: 'LockOpen',    status: 'backend-required' },
    ],
  },
]
