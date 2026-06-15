import type { NextConfig } from 'next'

const allowedDevOrigins =
  process.env.BOBO_ALLOWED_DEV_ORIGINS?.split(',')
    .map((origin) => origin.trim())
    .filter(Boolean) ?? []

const nextConfig: NextConfig = {
  allowedDevOrigins: allowedDevOrigins.length > 0 ? allowedDevOrigins : undefined,
  basePath: process.env.BOBO_BASE_PATH || undefined,
}

export default nextConfig
