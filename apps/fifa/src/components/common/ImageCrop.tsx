import type { Crop, PercentCrop, PixelCrop } from 'react-image-crop'

import { forwardRef, useCallback, useImperativeHandle, useRef, useState } from 'react'
import ReactCrop, { centerCrop, makeAspectCrop } from 'react-image-crop'
import 'react-image-crop/dist/ReactCrop.css'

export interface ImageCropProps {
  aspect?: number
  circularCrop?: boolean
  className?: string
  disabled?: boolean
  keepSelection?: boolean
  locked?: boolean
  maxHeight?: number
  maxWidth?: number
  minHeight?: number
  minWidth?: number
  onCropChange?: (crop: PixelCrop, percentCrop: PercentCrop) => void
  onCropComplete?: (crop: PixelCrop, percentCrop: PercentCrop) => void
  ruleOfThirds?: boolean
  src: string
}

export interface ImageCropRef {
  getImageElement: () => HTMLImageElement | null
}

/**
 * 计算居中的纵横比裁剪
 */
function centerAspectCrop(mediaWidth: number, mediaHeight: number, aspect: number) {
  return centerCrop(
    makeAspectCrop(
      {
        unit: '%',
        width: 90,
      },
      aspect,
      mediaWidth,
      mediaHeight,
    ),
    mediaWidth,
    mediaHeight,
  )
}

export const ImageCrop = forwardRef<ImageCropRef, ImageCropProps>(
  (
    {
      aspect,
      circularCrop = false,
      className,
      disabled = false,
      keepSelection = false,
      locked = false,
      maxHeight,
      maxWidth,
      minHeight = 10,
      minWidth = 10,
      onCropChange,
      onCropComplete,
      ruleOfThirds = false,
      src,
    },
    ref,
  ) => {
    const [crop, setCrop] = useState<Crop>()
    const imgRef = useRef<HTMLImageElement>(null)

    useImperativeHandle(ref, () => ({
      getImageElement: () => imgRef.current,
    }))

    const onImageLoad = useCallback(
      (e: React.SyntheticEvent<HTMLImageElement>) => {
        if (aspect) {
          const { height, width } = e.currentTarget
          setCrop(centerAspectCrop(width, height, aspect))
        }
      },
      [aspect],
    )

    const handleCropChange = useCallback(
      (crop: PixelCrop, percentCrop: PercentCrop) => {
        setCrop(crop)
        onCropChange?.(crop, percentCrop)
      },
      [onCropChange],
    )

    const handleCropComplete = useCallback(
      (crop: PixelCrop, percentCrop: PercentCrop) => {
        onCropComplete?.(crop, percentCrop)
      },
      [onCropComplete],
    )

    return (
      <div className={`image-crop-container ${className || ''}`}>
        <ReactCrop
          crop={crop}
          onChange={handleCropChange}
          onComplete={handleCropComplete}
          aspect={aspect}
          circularCrop={circularCrop}
          ruleOfThirds={ruleOfThirds}
          minWidth={minWidth}
          minHeight={minHeight}
          maxWidth={maxWidth}
          maxHeight={maxHeight}
          keepSelection={keepSelection}
          disabled={disabled}
          locked={locked}
        >
          <img ref={imgRef} alt="Crop me" src={src} onLoad={onImageLoad} />
        </ReactCrop>
      </div>
    )
  },
)
