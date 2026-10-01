// Resize only print copies; keep catalog originals untouched. CORS failures use the original.
export async function preparePrintImages(urls: string[], maxEdge: number): Promise<Map<string, string>> {
  const result = new Map<string, string>()
  const unique = [...new Set(urls.filter(Boolean))]
  const convert = (url: string) => new Promise<string>(resolve => {
    const image = new Image()
    image.crossOrigin = 'anonymous'
    const timer = setTimeout(() => finish(url), 8000)
    const finish = (value: string) => {
      clearTimeout(timer)
      image.onload = image.onerror = null
      resolve(value)
    }
    image.onerror = () => finish(url)
    image.onload = () => {
      try {
        const scale = Math.min(1, maxEdge / Math.max(image.naturalWidth, image.naturalHeight))
        const canvas = document.createElement('canvas')
        canvas.width = Math.max(1, Math.round(image.naturalWidth * scale))
        canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
        const context = canvas.getContext('2d')
        if (!context) return finish(url)
        context.fillStyle = '#ffffff'
        context.fillRect(0, 0, canvas.width, canvas.height)
        context.drawImage(image, 0, 0, canvas.width, canvas.height)
        finish(canvas.toDataURL('image/jpeg', 0.88))
        canvas.width = canvas.height = 0
      } catch { finish(url) }
    }
    image.src = url
  })
  for (let i = 0; i < unique.length; i += 4) {
    await Promise.all(unique.slice(i, i + 4).map(async url => result.set(url, await convert(url))))
  }
  return result
}
