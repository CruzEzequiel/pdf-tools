import { pdfjsLib } from './pdfWorker'

function makeCanvas(viewport: pdfjsLib.PageViewport) {
  const dpr = window.devicePixelRatio || 1
  const canvas = document.createElement('canvas')
  canvas.width = Math.floor(viewport.width * dpr)
  canvas.height = Math.floor(viewport.height * dpr)
  const ctx = canvas.getContext('2d')!
  ctx.scale(dpr, dpr)
  return { canvas, ctx }
}

export async function renderPageToDataUrl(
  file: File,
  pageNumber: number,
  scale = 1.5,
): Promise<string> {
  const buffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise
  const page = await pdf.getPage(pageNumber)
  const viewport = page.getViewport({ scale })
  const { canvas, ctx } = makeCanvas(viewport)
  await page.render({ canvasContext: ctx, viewport, canvas: null }).promise
  return canvas.toDataURL('image/jpeg', 0.92)
}

export async function renderAllPages(
  file: File,
  scale = 1.5,
): Promise<string[]> {
  const buffer = await file.arrayBuffer()
  const pdf = await pdfjsLib.getDocument({ data: buffer }).promise
  const total = pdf.numPages
  const thumbs: string[] = []

  for (let i = 1; i <= total; i++) {
    const page = await pdf.getPage(i)
    const viewport = page.getViewport({ scale })
    const { canvas, ctx } = makeCanvas(viewport)
    await page.render({ canvasContext: ctx, viewport, canvas: null }).promise
    thumbs.push(canvas.toDataURL('image/jpeg', 0.92))
  }

  return thumbs
}
