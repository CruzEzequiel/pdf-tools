import { pdfjsLib } from '../services/pdfWorker'

export async function pdfPageToPng(file: File, pageNumber: number, scale = 2): Promise<Blob> {
  const buffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise
  const page = await pdf.getPage(pageNumber)

  const viewport = page.getViewport({ scale })
  const canvas = document.createElement('canvas')
  canvas.width = viewport.width
  canvas.height = viewport.height

  await page.render({ canvasContext: canvas.getContext('2d')!, viewport }).promise

  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => blob ? resolve(blob) : reject(new Error('Error al generar imagen')), 'image/png')
  })
}
