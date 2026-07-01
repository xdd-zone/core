import { createCipheriv, createDecipheriv, randomBytes } from 'node:crypto'

const ALGORITHM = 'aes-256-gcm'
const IV_LENGTH = 12
const TAG_LENGTH = 16

export function encryptLlmSecret(plainText: string, keyBase64: string): string {
  const key = decodeLlmSecretKey(keyBase64)
  const iv = randomBytes(IV_LENGTH)
  const cipher = createCipheriv(ALGORITHM, key, iv)
  const encrypted = Buffer.concat([cipher.update(plainText, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()

  return Buffer.concat([iv, tag, encrypted]).toString('base64')
}

export function decryptLlmSecret(ciphertext: string, keyBase64: string): string {
  const key = decodeLlmSecretKey(keyBase64)
  const payload = Buffer.from(ciphertext, 'base64')
  const iv = payload.subarray(0, IV_LENGTH)
  const tag = payload.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH)
  const encrypted = payload.subarray(IV_LENGTH + TAG_LENGTH)
  const decipher = createDecipheriv(ALGORITHM, key, iv)
  decipher.setAuthTag(tag)

  return Buffer.concat([decipher.update(encrypted), decipher.final()]).toString('utf8')
}

export function createApiKeyHint(apiKey: string): string {
  if (apiKey.length <= 8) {
    return '****'
  }

  return `****${apiKey.slice(-4)}`
}

function decodeLlmSecretKey(keyBase64: string): Buffer {
  const key = Buffer.from(keyBase64, 'base64')

  if (key.length !== 32) {
    throw new Error('LLM_SECRET_KEY 必须是 32 字节 base64 字符串')
  }

  return key
}
