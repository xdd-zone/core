import type { PixelCrop } from 'react-image-crop'

import type { ImageCropRef } from '@/components/common'
import { Button, Card, Col, Divider, Row, Space, Switch, Typography } from 'antd'
import { Crop, Download, Eye, EyeOff, Square } from 'lucide-react'

import { useEffect, useRef, useState } from 'react'

import sullyoon from '@/assets/images/sullyoon.jpg'
import { ImageCrop } from '@/components/common'
import { downloadCroppedImage, getCroppedImg } from '@/utils/cropUtils'

const { Text, Title } = Typography

export function ImageCropExample() {
  const [crop, setCrop] = useState<PixelCrop>()
  const [previewUrl, setPreviewUrl] = useState<string>('')
  const [cropMode, setCropMode] = useState<'free' | 'square'>('square')
  const [showInitialCrop, setShowInitialCrop] = useState(false)

  const cropRef = useRef<ImageCropRef>(null)

  const [circularCrop, setCircularCrop] = useState(false)
  const [ruleOfThirds, setRuleOfThirds] = useState(false)
  const [disabled, setDisabled] = useState(false)
  const [locked, setLocked] = useState(false)

  const generatePreview = async (crop: PixelCrop) => {
    if (!crop || !cropRef.current) return

    const imgElement = cropRef.current.getImageElement()
    if (!imgElement) return

    try {
      const { url } = await getCroppedImg(imgElement, crop)
      setPreviewUrl(url)
    } catch (error) {
      console.error('生成预览失败:', error)
    }
  }

  // 当显示初始裁剪框时，设置一个默认的裁剪区域
  useEffect(() => {
    // 使用 requestAnimationFrame 避免同步 setState 导致的级联渲染
    const rafId = requestAnimationFrame(() => {
      if (showInitialCrop) {
        const initialCrop: PixelCrop = {
          height: cropMode === 'square' ? 200 : 150,
          unit: 'px',
          width: 200,
          x: 50,
          y: 50,
        }
        setCrop(initialCrop)
        generatePreview(initialCrop)
      } else {
        setCrop(undefined)
        setPreviewUrl('')
      }
    })
    return () => cancelAnimationFrame(rafId)
  }, [showInitialCrop, cropMode])

  const handleDownload = async () => {
    if (!crop || !cropRef.current) return

    const imgElement = cropRef.current.getImageElement()
    if (!imgElement) return

    try {
      const { blob } = await getCroppedImg(imgElement, crop)
      const fileName = cropMode === 'square' ? 'cropped-square.jpg' : 'cropped-free-form.jpg'
      downloadCroppedImage(blob, fileName)
    } catch (error) {
      console.error('下载失败:', error)
    }
  }

  const handleCropComplete = (crop: PixelCrop) => {
    generatePreview(crop)
  }

  const handleCropChange = (crop: PixelCrop) => {
    setCrop(crop)
  }

  const handleModeChange = (mode: 'free' | 'square') => {
    setCropMode(mode)
    // 清除当前预览
    setPreviewUrl('')
    setCrop(undefined)
  }

  const handleInitialCropToggle = () => {
    setShowInitialCrop(!showInitialCrop)
  }

  return (
    <div style={{ padding: '24px' }}>
      <Title level={2}>图片裁剪组件示例</Title>
      <Text type="secondary">基于 react-image-crop 的图片裁剪组件，支持多种裁剪模式和配置选项。</Text>

      <Divider />

      {/* 控制面板 */}
      <Card title="控制面板" style={{ marginBottom: '24px' }}>
        <Space orientation="vertical" size="middle" style={{ width: '100%' }}>
          {/* 裁剪模式控制 */}
          <div>
            <Text strong style={{ display: 'block', marginBottom: '8px' }}>
              裁剪模式:
            </Text>
            <Space size="middle" wrap>
              <Button
                type={cropMode === 'free' ? 'primary' : 'default'}
                icon={<Crop size={16} />}
                onClick={() => handleModeChange('free')}
              >
                自由裁剪
              </Button>
              <Button
                type={cropMode === 'square' ? 'primary' : 'default'}
                icon={<Square size={16} />}
                onClick={() => handleModeChange('square')}
              >
                正方形裁剪 (1:1)
              </Button>
            </Space>
          </div>

          {/* 初始裁剪框控制 */}
          <div>
            <Text strong style={{ display: 'block', marginBottom: '8px' }}>
              初始裁剪框:
            </Text>
            <Button
              type={showInitialCrop ? 'primary' : 'default'}
              icon={showInitialCrop ? <EyeOff size={16} /> : <Eye size={16} />}
              onClick={handleInitialCropToggle}
            >
              {showInitialCrop ? '隐藏' : '显示'}初始裁剪框
            </Button>
          </div>

          {/* 其他选项 */}
          <div>
            <Text strong style={{ display: 'block', marginBottom: '8px' }}>
              其他选项:
            </Text>
            <Space size="middle" wrap>
              <Space>
                <Text>圆形裁剪:</Text>
                <Switch checked={circularCrop} onChange={setCircularCrop} />
              </Space>
              <Space>
                <Text>三分法线:</Text>
                <Switch checked={ruleOfThirds} onChange={setRuleOfThirds} />
              </Space>
              <Space>
                <Text>禁用:</Text>
                <Switch checked={disabled} onChange={setDisabled} />
              </Space>
              <Space>
                <Text>锁定:</Text>
                <Switch checked={locked} onChange={setLocked} />
              </Space>
            </Space>
          </div>
        </Space>
      </Card>

      <Row gutter={[24, 24]}>
        {/* 裁剪区域 */}
        <Col xs={24} lg={12}>
          <Card title={cropMode === 'square' ? '正方形裁剪 (1:1)' : '自由裁剪'} size="small">
            <ImageCrop
              ref={cropRef}
              src={sullyoon}
              aspect={cropMode === 'square' ? 1 : undefined}
              circularCrop={circularCrop}
              ruleOfThirds={ruleOfThirds}
              disabled={disabled}
              locked={locked}
              onCropChange={handleCropChange}
              onCropComplete={handleCropComplete}
            />
            {crop && (
              <div style={{ color: '#666', fontSize: '12px', marginTop: '12px' }}>
                <Text code>
                  x: {Math.round(crop.x)}, y: {Math.round(crop.y)}, width: {Math.round(crop.width)}, height:{' '}
                  {Math.round(crop.height)}
                </Text>
              </div>
            )}
          </Card>
        </Col>

        {/* 预览区域 */}
        <Col xs={24} lg={12}>
          <Card title="裁剪预览" size="small">
            {previewUrl ? (
              <div>
                <div
                  style={{
                    alignItems: 'center',
                    display: 'flex',
                    justifyContent: 'space-between',
                    marginBottom: '16px',
                  }}
                >
                  <Text strong>预览结果:</Text>
                  <Button type="primary" size="small" icon={<Download size={14} />} onClick={handleDownload}>
                    下载
                  </Button>
                </div>
                <img
                  src={previewUrl}
                  alt="裁剪预览"
                  style={{
                    border: '1px solid #d9d9d9',
                    borderRadius: '6px',
                    maxHeight: '300px',
                    maxWidth: '100%',
                  }}
                />
              </div>
            ) : (
              <div style={{ color: '#999', padding: '40px', textAlign: 'center' }}>
                <Text type="secondary">{showInitialCrop ? '请调整裁剪区域' : '请先进行裁剪操作或显示初始裁剪框'}</Text>
              </div>
            )}
          </Card>
        </Col>
      </Row>
    </div>
  )
}
