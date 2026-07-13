import type { NextConfig } from 'next'

const allowedDevOrigins =
  process.env.BOBO_ALLOWED_DEV_ORIGINS?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean) ?? []

const nextConfig: NextConfig = {
  allowedDevOrigins: allowedDevOrigins.length > 0 ? allowedDevOrigins : undefined,
  output: 'standalone',
}

export default nextConfig
