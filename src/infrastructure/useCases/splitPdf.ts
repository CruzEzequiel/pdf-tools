import { PDFDocument } from 'pdf-lib'

export interface SplitRange {
  from: number // 1-based
  to: number
  name: string
}

export interface SplitResult {
  name: string
  bytes: Uint8Array
}

export async function splitPdf(file: File, ranges: SplitRange[]): Promise<SplitResult[]> {
  const buffer = await file.arrayBuffer()
  const source = await PDFDocument.load(buffer)
  const total = source.getPageCount()

  const results: SplitResult[] = []

  for (const range of ranges) {
    const from = Math.max(1, range.from)
    const to = Math.min(total, range.to)
    const indices = Array.from({ length: to - from + 1 }, (_, i) => from - 1 + i)

    const doc = await PDFDocument.create()
    const pages = await doc.copyPages(source, indices)
    pages.forEach((p) => doc.addPage(p))

    results.push({ name: range.name, bytes: await doc.save() })
  }

  return results
}

export async function getPdfPageCount(file: File): Promise<number> {
  const buffer = await file.arrayBuffer()
  const doc = await PDFDocument.load(buffer)
  return doc.getPageCount()
}
