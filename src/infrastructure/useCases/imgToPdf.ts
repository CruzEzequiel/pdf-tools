import { PDFDocument } from 'pdf-lib'

export async function imgToPdf(files: File[]): Promise<Uint8Array> {
  const doc = await PDFDocument.create()

  for (const file of files) {
    const buffer = await file.arrayBuffer()
    const mime = file.type

    const img = mime === 'image/png'
      ? await doc.embedPng(buffer)
      : await doc.embedJpg(buffer)

    const page = doc.addPage([img.width, img.height])
    page.drawImage(img, { x: 0, y: 0, width: img.width, height: img.height })
  }

  return doc.save()
}
