import { mkdir, writeFile } from 'node:fs/promises'
import { dirname, resolve } from 'node:path'
import { createApp } from '../src/app'

/**
 * 解析命令行输出路径。
 */
function resolveOutputPath() {
  const outputArg = Bun.argv[2]

  if (outputArg) {
    return resolve(process.cwd(), outputArg)
  }

  return resolve(import.meta.dir, '../openapi/openapi.json')
}

async function main() {
  const outputPath = resolveOutputPath()
  const app = createApp()
  const response = await app.handle(new Request('http://localhost/openapi/json'))

  if (!response.ok) {
    throw new Error(`导出 OpenAPI 失败: ${response.status} ${response.statusText}`)
  }

  const document = await response.text()

  await mkdir(dirname(outputPath), { recursive: true })
  await writeFile(outputPath, `${document}\n`, 'utf8')

  console.log(`已导出 OpenAPI 文档到: ${outputPath}`)
}

await main()
