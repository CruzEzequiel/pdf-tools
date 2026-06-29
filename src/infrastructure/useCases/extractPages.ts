import { PDFDocument } from 'pdf-lib'

export async function extractPages(file: File, pages: number[]): Promise<Uint8Array> {
  const buffer = await file.arrayBuffer()
  const source = await PDFDocument.load(buffer)
  const doc = await PDFDocument.create()

  const indices = pages.map((p) => p - 1) // 1-based → 0-based
  const copied = await doc.copyPages(source, indices)
  copied.forEach((p) => doc.addPage(p))

  return doc.save()
}
