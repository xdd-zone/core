#!/usr/bin/env bun

/**
 * 测试数据库管理脚本
 * 用于启动、停止和重置测试用的 PostgreSQL 数据库
 */

import { $ } from 'bun'

// 配置常量
const SCRIPT_DIR = import.meta.dir
const COMPOSE_FILE = `${SCRIPT_DIR}/docker-compose.test.yml`
const CONTAINER_NAME = 'xdd-postgres-test'
const DB_NAME = 'xdd_test_db'
const DB_USER = 'xdd_user'
const DB_PORT = 5433
const DB_PASSWORD = 'xdd123456'

// 颜色定义
const colors = {
  red: '\x1B[0;31m',
  green: '\x1B[0;32m',
  yellow: '\x1B[1;33m',
  blue: '\x1B[0;34m',
  reset: '\x1B[0m',
}

// 辅助函数
function printInfo(message: string) {
  console.log(`${colors.blue}[INFO]${colors.reset} ${message}`)
}

function printSuccess(message: string) {
  console.log(`${colors.green}[SUCCESS]${colors.reset} ${message}`)
}

function printWarning(message: string) {
  console.log(`${colors.yellow}[WARNING]${colors.reset} ${message}`)
}

function printError(message: string) {
  console.error(`${colors.red}[ERROR]${colors.reset} ${message}`)
}

function printSeparator() {
  console.log(
    '============================================================================',
  )
}

async function checkDocker(): Promise<void> {
  try {
    await $`docker --version`.quiet()
  }
  catch {
    printError('Docker 未安装，请先安装 Docker')
    process.exit(1)
  }

  try {
    await $`docker compose version`.quiet()
  }
  catch {
    try {
      await $`docker-compose --version`.quiet()
    }
    catch {
      printError('Docker Compose 未安装，请先安装 Docker Compose')
      process.exit(1)
    }
  }
}

async function getDockerComposeCmd(): Promise<string[]> {
  try {
    await $`docker compose version`.quiet()
    return ['docker', 'compose']
  }
  catch {
    // Ignore error and try docker-compose
  }

  try {
    await $`docker-compose --version`.quiet()
    return ['docker-compose']
  }
  catch {
    // Ignore error
  }

  // Default to docker compose plugin as it's more common in modern Docker
  return ['docker', 'compose']
}

async function isContainerRunning(): Promise<boolean> {
  try {
    const result = await $`docker ps --format '{{.Names}}'`.quiet()
    return result.stdout.toString().trim().split('\n').includes(CONTAINER_NAME)
  }
  catch {
    return false
  }
}

async function startDb(): Promise<void> {
  printInfo('启动测试数据库...')

  const dockerCompose = await getDockerComposeCmd()

  // 检查是否已经在运行
  if (await isContainerRunning()) {
    printWarning('测试数据库已经在运行中')
    return
  }

  // 启动服务
  try {
    await $`${dockerCompose[0]} ${dockerCompose.slice(1).join(' ')} -f ${COMPOSE_FILE} up -d`

    // 等待数据库启动
    printInfo('等待数据库启动...')
    await new Promise(resolve => setTimeout(resolve, 3000))

    // 检查容器状态
    if (await isContainerRunning()) {
      printSuccess('测试数据库启动成功！')
      printInfo('连接信息：')
      console.log(`  Host: localhost`)
      console.log(`  Port: ${DB_PORT}`)
      console.log(`  Database: ${DB_NAME}`)
      console.log(`  Username: ${DB_USER}`)
      console.log(`  Password: ${DB_PASSWORD}`)
      console.log('')
      printInfo('连接字符串：')
      console.log(
        `  postgresql://${DB_USER}:${DB_PASSWORD}@localhost:${DB_PORT}/${DB_NAME}`,
      )
    }
    else {
      throw new Error('容器未成功启动')
    }
  }
  catch (error) {
    printError(`启动失败: ${error}`)
    throw error // 抛出错误而不是退出
  }
}

async function stopDb(): Promise<void> {
  printInfo('停止测试数据库...')

  const dockerCompose = await getDockerComposeCmd()

  // 检查是否在运行
  if (!(await isContainerRunning())) {
    printWarning('测试数据库未在运行')
    return
  }

  try {
    await $`${dockerCompose[0]} ${dockerCompose.slice(1).join(' ')} -f ${COMPOSE_FILE} stop`
    printSuccess('测试数据库已停止')
  }
  catch (error) {
    printError(`停止失败: ${error}`)
    throw error // 抛出错误而不是退出
  }
}

async function resetDb(
  force = false,
  inputReader?: ReadableStreamDefaultReader<Uint8Array> | null,
): Promise<void> {
  if (!force) {
    printWarning('此操作将删除测试数据库中的所有数据！')
    process.stdout.write('确认重置？(y/N): ')

    const decoder = new TextDecoder()
    const reader = inputReader ?? Bun.stdin.stream().getReader()

    try {
      let rawInput = ''
      while (true) {
        const { value, done } = await reader.read()
        if (done || !value)
          break
        rawInput += decoder.decode(value)
        if (rawInput.includes('\n') || rawInput.includes('\r'))
          break
      }

      const input = rawInput.trim()

      console.log()

      if (!input || !/^Y/i.test(input)) {
        printInfo('操作已取消')
        return
      }
    }
    finally {
      if (!inputReader) {
        reader.releaseLock()
      }
    }
  }

  printInfo('重置测试数据库...')

  const dockerCompose = await getDockerComposeCmd()

  try {
    // 停止并删除容器和数据卷
    await $`${dockerCompose[0]} ${dockerCompose.slice(1).join(' ')} -f ${COMPOSE_FILE} down -v`

    // 重新启动
    await new Promise(resolve => setTimeout(resolve, 1000))
    await startDb()

    printSuccess('测试数据库已重置')
  }
  catch (error) {
    printError(`重置失败: ${error}`)
    throw error // 抛出错误而不是退出
  }
}

function showHelp(): void {
  printSeparator()
  console.log('测试数据库管理脚本')
  printSeparator()
  console.log('')
  console.log('用法: bun test-db.ts [command]')
  console.log('      如果不指定命令，将显示交互式菜单')
  console.log('')
  console.log('命令:')
  console.log('  start    启动测试数据库')
  console.log('  stop     停止测试数据库')
  console.log('  reset    重置数据库（删除所有数据）')
  console.log('  status   查看数据库状态')
  console.log('  help     显示此帮助信息')
  console.log('')
  printSeparator()
}

async function showInteractiveMenu(): Promise<void> {
  // 菜单选项
  const menuOptions = [
    { key: '1', label: '启动测试数据库', action: startDb, needsInput: false },
    { key: '2', label: '停止测试数据库', action: stopDb, needsInput: false },
    {
      key: '3',
      label: '重置数据库（删除所有数据）',
      action: async () => {
        // 先退出 raw mode 以便正常读取输入
        process.stdin.setRawMode(false)
        restoreCursor()

        console.clear()
        printSeparator()
        console.log('重置数据库')
        printSeparator()
        console.log('')

        try {
          const menuReader = ensureReader()
          if (!menuReader) {
            throw new Error('Reader 未初始化')
          }
          await resetDb(false, menuReader)
        }
        catch (error) {
          printError(`操作失败: ${error}`)
        }

        // 等待用户确认
        console.log('')
        process.stdout.write('按任意键继续...')

        const menuReader = ensureReader()
        if (!menuReader) {
          throw new Error('Reader 未初始化')
        }
        process.stdin.setRawMode(true)
        await menuReader.read()
        process.stdin.setRawMode(false)
        restoreCursor()

        // 返回特殊标记表示已处理所有 UI
        return { handled: true }
      },
      needsInput: false,
    },
    {
      key: '4',
      label: '查看数据库状态',
      action: async () => {
        const isRunning = await isContainerRunning()
        if (isRunning) {
          printSuccess('测试数据库正在运行')
          printInfo('连接信息：')
          console.log(`  Host: localhost`)
          console.log(`  Port: ${DB_PORT}`)
          console.log(`  Database: ${DB_NAME}`)
          console.log(`  Username: ${DB_USER}`)
          console.log(`  Password: ${DB_PASSWORD}`)
        }
        else {
          printWarning('测试数据库未运行')
        }
      },
      needsInput: false,
    },
    {
      key: '0',
      label: '退出',
      action: () => {
        /* 不退出，由菜单控制 */
      },
      needsInput: false,
    },
  ]

  let selectedIndex = 0
  let shouldExit = false

  // 创建单一的 stdin stream 和 reader（只创建一次）
  let stdin: ReadableStream<Uint8Array> | null = null
  let reader: ReadableStreamDefaultReader<Uint8Array> | null = null

  try {
    stdin = Bun.stdin.stream()
    reader = stdin.getReader()
  }
  catch (error) {
    printError(`无法创建输入流: ${error}`)
    return
  }

  function ensureReader(): ReadableStreamDefaultReader<Uint8Array> | null {
    if (!stdin)
      return null
    if (!reader) {
      reader = stdin.getReader()
    }
    return reader
  }

  // 清屏并显示菜单
  function renderMenu() {
    // 清屏 (ANSI escape code)
    console.clear()

    printSeparator()
    console.log('测试数据库管理 - 交互式菜单')
    printSeparator()
    console.log('')
    console.log('使用 ↑↓ 键选择，按 Enter 确认')
    console.log('')

    // 渲染菜单项
    menuOptions.forEach((option, index) => {
      const isSelected = index === selectedIndex
      const prefix = isSelected ? `${colors.green}▶️${colors.reset}` : ' '
      const label = isSelected
        ? `${colors.green}${option.label}${colors.reset}`
        : option.label
      console.log(`  ${prefix} ${label}`)
    })

    console.log('')
    process.stdout.write('\x1B[?25l') // 隐藏光标
  }

  // 恢复光标
  function restoreCursor() {
    process.stdout.write('\x1B[?25h')
  }

  // 主循环
  while (!shouldExit) {
    try {
      if (!ensureReader()) {
        printError('无法初始化输入 Reader')
        return
      }

      // 设置 stdin 为原始模式
      process.stdin.setRawMode(true)

      // 初始渲染
      renderMenu()

      // 处理按键输入
      async function handleKeyPress(): Promise<boolean> {
        let result: any

        try {
          result = await reader!.read()
        }
        catch (error) {
          // 读取出错，重新开始循环
          printError(`读取输入时出错: ${error}`)
          return true
        }

        const { value, done } = result

        // 如果流已结束（可能是之前被消费了），跳过这次处理
        if (done || !value) {
          // 返回 true 让外层重新开始循环
          return true
        }

        const input = new Uint8Array(value)

        // 检测箭头键（转义序列）
        if (input.length === 3 && input[0] === 0x1B && input[1] === 0x5B) {
          // 上箭头: 0x1b 0x5b 0x41
          // 下箭头: 0x1b 0x5b 0x42
          if (input[2] === 0x41) {
            selectedIndex
              = (selectedIndex - 1 + menuOptions.length) % menuOptions.length
          }
          else if (input[2] === 0x42) {
            selectedIndex = (selectedIndex + 1) % menuOptions.length
          }
          return false // 继续监听
        }

        // 检测回车键
        if (input.length === 1 && input[0] === 0x0D) {
          return true // 确认选择，退出监听
        }

        // 检测 q/Q 键直接退出
        if (input.length === 1 && (input[0] === 0x71 || input[0] === 0x51)) {
          selectedIndex = menuOptions.length - 1 // 选择"退出"
          return true
        }

        // 检测数字键快速选择
        if (input.length === 1 && input[0] >= 0x30 && input[0] <= 0x34) {
          const digit = String.fromCharCode(input[0])
          const index = menuOptions.findIndex(opt => opt.key === digit)
          if (index !== -1) {
            selectedIndex = index
            return true
          }
        }

        return false // 继续监听
      }

      // 按键监听循环
      let waitingForSelection = true
      while (waitingForSelection) {
        const shouldConfirm = await handleKeyPress()

        if (shouldConfirm) {
          waitingForSelection = false
        }
        else {
          // 更新菜单显示
          renderMenu()
        }
      }

      // 执行选中的操作
      const selectedOption = menuOptions[selectedIndex]

      // 恢复正常模式
      restoreCursor()
      process.stdin.setRawMode(false)

      console.log('') // 空行

      // 检查是否是退出选项
      if (selectedOption.key === '0') {
        shouldExit = true
        break
      }

      if (selectedOption.needsInput) {
        try {
          reader?.releaseLock()
        }
        catch {}
        reader = null
      }

      printInfo(`执行: ${selectedOption.label}`)

      try {
        const result = await selectedOption.action()

        // 如果 action 返回 { handled: true }，表示已处理所有 UI，跳过默认的等待按键
        const handledResult = result as { handled?: boolean } | undefined
        if (handledResult && handledResult.handled) {
          ensureReader()
          // 重新显示菜单
          selectedIndex = 0
          continue
        }
      }
      catch (error) {
        printError(`操作失败: ${error}`)
      }

      // 等待用户确认后返回菜单
      console.log('')
      process.stdout.write('按任意键继续...')

      try {
        const currentReader = ensureReader()
        if (!currentReader) {
          throw new Error('Reader 未初始化')
        }

        // 重新设置 raw mode
        process.stdin.setRawMode(true)

        await currentReader.read()

        // 恢复正常模式
        process.stdin.setRawMode(false)
        restoreCursor()

        // 读取成功，继续循环
      }
      catch {
        // 读取出错时也返回菜单，不退出
        process.stdin.setRawMode(false)
        restoreCursor()
        printWarning(`读取输入时出错，返回菜单...`)
      }

      // 重新显示菜单
      selectedIndex = 0
      continue
    }
    finally {
      // 恢复正常模式（不释放 reader，继续复用）
      try {
        process.stdin.setRawMode(false)
        restoreCursor()
      }
      catch (error) {
        // 清理失败时忽略错误，避免影响循环
        printWarning(`恢复正常模式时出错: ${error}`)
      }
    }
  }

  // 清理资源
  try {
    if (reader) {
      reader.releaseLock()
    }
  }
  catch {}

  printInfo('退出')
}

// 主程序
async function main() {
  await checkDocker()

  const command = process.argv[2]

  // 如果没有指定命令，显示交互式菜单
  if (!command) {
    await showInteractiveMenu()
    process.exit(0)
  }

  switch (command) {
    case 'start':
      await startDb()
      break
    case 'stop':
      await stopDb()
      break
    case 'reset':
      await resetDb()
      break
    case 'status': {
      const isRunning = await isContainerRunning()
      if (isRunning) {
        printSuccess('测试数据库正在运行')
        printInfo('连接信息：')
        console.log(`  Host: localhost`)
        console.log(`  Port: ${DB_PORT}`)
        console.log(`  Database: ${DB_NAME}`)
        console.log(`  Username: ${DB_USER}`)
        console.log(`  Password: ${DB_PASSWORD}`)
      }
      else {
        printWarning('测试数据库未运行')
        process.exit(1)
      }
      break
    }
    case 'help':
    case '--help':
    case '-h':
      showHelp()
      break
    default:
      printError(`未知命令: ${command}`)
      console.log('')
      showHelp()
      process.exit(1)
  }
}

// 执行主程序
main().catch((error) => {
  printError(`脚本执行出错: ${error}`)
  process.exit(1)
})
