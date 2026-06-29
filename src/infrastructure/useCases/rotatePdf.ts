import { PDFDocument, degrees } from 'pdf-lib'

export type RotationAngle = 90 | 180 | 270

export async function rotatePdf(
  file: File,
  rotations: Record<number, RotationAngle>, // key: 0-based page index
): Promise<Uint8Array> {
  const buffer = await file.arrayBuffer()
  const doc = await PDFDocument.load(buffer)

  for (const [indexStr, angle] of Object.entries(rotations)) {
    const index = Number(indexStr)
    const page = doc.getPage(index)
    const current = page.getRotation().angle
    page.setRotation(degrees((current + angle) % 360))
  }

  return doc.save()
}
