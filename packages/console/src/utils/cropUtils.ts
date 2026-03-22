import type { PixelCrop } from 'react-image-crop'

/**
 * 将图片和裁剪区域转换为Canvas
 */
export function getCroppedImg(
  image: HTMLImageElement,
  crop: PixelCrop,
): Promise<{ blob: Blob; canvas: HTMLCanvasElement; url: string }> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      reject(new Error('无法获取canvas上下文'))
      return
    }

    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height

    // 设置canvas尺寸为裁剪区域的尺寸
    canvas.width = crop.width
    canvas.height = crop.height

    // 创建一个新的图片元素来处理跨域问题
    const tempImg = new Image()
    tempImg.crossOrigin = 'anonymous'

    tempImg.onload = () => {
      // 绘制裁剪后的图片
      ctx.drawImage(
        tempImg,
        crop.x * scaleX,
        crop.y * scaleY,
        crop.width * scaleX,
        crop.height * scaleY,
        0,
        0,
        crop.width,
        crop.height,
      )

      // 转换为blob
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Canvas转换为Blob失败'))
            return
          }

          const url = URL.createObjectURL(blob)
          resolve({ blob, canvas, url })
        },
        'image/jpeg',
        0.95,
      )
    }

    tempImg.onerror = () => {
      // 如果跨域加载失败，尝试直接使用原图片
      try {
        ctx.drawImage(
          image,
          crop.x * scaleX,
          crop.y * scaleY,
          crop.width * scaleX,
          crop.height * scaleY,
          0,
          0,
          crop.width,
          crop.height,
        )

        canvas.toBlob(
          (blob) => {
            if (!blob) {
              reject(new Error('Canvas转换为Blob失败'))
              return
            }

            const url = URL.createObjectURL(blob)
            resolve({ blob, canvas, url })
          },
          'image/jpeg',
          0.95,
        )
      } catch (error) {
        reject(new Error(`图片处理失败，可能是跨域限制导致的: ${error instanceof Error ? error.message : '未知错误'}`))
      }
    }

    // 设置图片源，触发加载
    tempImg.src = image.src
  })
}

/**
 * 下载裁剪后的图片
 */
export function downloadCroppedImage(blob: Blob, fileName: string = 'cropped-image.jpg') {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
  URL.revokeObjectURL(url)
}

/**
 * 获取裁剪预览的数据URL
 */
export function getCroppedImageDataUrl(image: HTMLImageElement, crop: PixelCrop): Promise<string> {
  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')

    if (!ctx) {
      reject(new Error('无法获取canvas上下文'))
      return
    }

    const scaleX = image.naturalWidth / image.width
    const scaleY = image.naturalHeight / image.height

    canvas.width = crop.width
    canvas.height = crop.height

    ctx.drawImage(
      image,
      crop.x * scaleX,
      crop.y * scaleY,
      crop.width * scaleX,
      crop.height * scaleY,
      0,
      0,
      crop.width,
      crop.height,
    )

    const dataUrl = canvas.toDataURL('image/jpeg', 0.95)
    resolve(dataUrl)
  })
}
