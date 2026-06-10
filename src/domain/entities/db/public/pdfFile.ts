export interface PdfFile {
  id: string
  file: File
  name: string
  size: number
  pageCount: number
  preview?: string // base64 thumbnail of first page
}
