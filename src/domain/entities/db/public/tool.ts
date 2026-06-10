export type ToolStatus = 'available' | 'backend-required'

export interface Tool {
  id: string
  label: string
  description: string
  path: string
  icon: string
  status: ToolStatus
  category: ToolCategory
}

export type ToolCategory = 'organize' | 'edit' | 'convert' | 'security'
