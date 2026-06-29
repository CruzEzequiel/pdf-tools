import { PDFDocument } from 'pdf-lib'

export async function reorderPages(file: File, order: number[]): Promise<Uint8Array> {
  const buffer = await file.arrayBuffer()
  const source = await PDFDocument.load(buffer)
  const doc = await PDFDocument.create()

  const indices = order.map((p) => p - 1) // 1-based → 0-based
  const copied = await doc.copyPages(source, indices)
  copied.forEach((p) => doc.addPage(p))

  return doc.save()
}
