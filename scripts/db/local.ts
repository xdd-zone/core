#!/usr/bin/env bun

/**
 * 本地数据库运行时管理脚本
 *
 * 说明：
 * - 统一管理 XDD Zone Core 的本地 PostgreSQL
 * - 提供 up / down / reset / status / url / logs / prepare 标准动作
 * - prepare 会在数据库就绪后自动执行 Prisma push 与 seed
 */

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const SCRIPT_DIR = dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = resolve(SCRIPT_DIR, "../..");
const COMPOSE_FILE = resolve(SCRIPT_DIR, "docker-compose.local.yml");

const DB_CONFIG = {
  containerName: "xdd-core-db-local",
  serviceName: "postgres",
  host: "localhost",
  port: 55432,
  database: "xdd_core_local",
  user: "xdd",
  password: "xdd_local_dev",
};

const DB_URL = `postgresql://${DB_CONFIG.user}:${DB_CONFIG.password}@${DB_CONFIG.host}:${DB_CONFIG.port}/${DB_CONFIG.database}`;

const colors = {
  blue: "\x1B[34m",
  green: "\x1B[32m",
  yellow: "\x1B[33m",
  red: "\x1B[31m",
  reset: "\x1B[0m",
};

const loadingFrames = ["-", "\\", "|", "/"];

/**
 * 输出信息日志
 * @param message 日志内容
 */
function printInfo(message: string): void {
  console.log(`${colors.blue}[db:local]${colors.reset} ${message}`);
}

/**
 * 输出成功日志
 * @param message 日志内容
 */
function printSuccess(message: string): void {
  console.log(`${colors.green}[success]${colors.reset} ${message}`);
}

/**
 * 输出警告日志
 * @param message 日志内容
 */
function printWarning(message: string): void {
  console.warn(`${colors.yellow}[warning]${colors.reset} ${message}`);
}

/**
 * 输出错误日志
 * @param message 日志内容
 */
function printError(message: string): void {
  console.error(`${colors.red}[error]${colors.reset} ${message}`);
}

/**
 * 在长时间任务执行期间输出 loading 状态
 * @param message 提示信息
 * @param action 任务函数
 */
async function withLoading<T>(
  message: string,
  action: () => Promise<T>,
): Promise<T> {
  const startAt = Date.now();
  let frameIndex = 0;

  process.stdout.write(`${colors.blue}[loading]${colors.reset} ${message}`);

  const timer = setInterval(() => {
    const elapsedSeconds = Math.floor((Date.now() - startAt) / 1000);
    const frame = loadingFrames[frameIndex % loadingFrames.length];
    frameIndex += 1;

    process.stdout.write(
      `\r${colors.blue}[loading]${colors.reset} ${message} ${frame} ${elapsedSeconds}s`,
    );
  }, 200);

  try {
    const result = await action();
    const elapsedSeconds = Math.floor((Date.now() - startAt) / 1000);
    process.stdout.write(
      `\r${colors.green}[done]${colors.reset} ${message} ${elapsedSeconds}s\n`,
    );
    return result;
  } catch (error) {
    const elapsedSeconds = Math.floor((Date.now() - startAt) / 1000);
    process.stdout.write(
      `\r${colors.red}[failed]${colors.reset} ${message} ${elapsedSeconds}s\n`,
    );
    throw error;
  } finally {
    clearInterval(timer);
  }
}

/**
 * 休眠指定毫秒
 * @param ms 毫秒数
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * 获取 Docker Compose 命令前缀
 */
async function getDockerComposeCommand(): Promise<string[]> {
  try {
    await runCommand(["docker", "compose", "version"], { quiet: true });
    return ["docker", "compose"];
  } catch {
    await runCommand(["docker-compose", "--version"], { quiet: true });
    return ["docker-compose"];
  }
}

/**
 * 执行命令
 * @param args 命令参数
 * @param options 执行选项
 */
async function runCommand(
  args: string[],
  options: {
    cwd?: string;
    env?: Record<string, string>;
    quiet?: boolean;
  } = {},
): Promise<string> {
  const proc = Bun.spawn(args, {
    cwd: options.cwd ?? REPO_ROOT,
    env: {
      ...process.env,
      ...options.env,
    },
    stdout: "pipe",
    stderr: "pipe",
  });

  const [stdout, stderr, exitCode] = await Promise.all([
    new Response(proc.stdout).text(),
    new Response(proc.stderr).text(),
    proc.exited,
  ]);

  if (exitCode !== 0) {
    throw new Error(
      stderr.trim() || stdout.trim() || `${args.join(" ")} 执行失败`,
    );
  }

  if (!options.quiet) {
    const output = stdout.trim();
    if (output) {
      console.log(output);
    }
  }

  return stdout.trim();
}

/**
 * 执行 Docker Compose 命令
 * @param args Compose 参数
 * @param options 执行选项
 */
async function runComposeCommand(
  args: string[],
  options: {
    quiet?: boolean;
  } = {},
): Promise<string> {
  const composeCommand = await getDockerComposeCommand();

  return await runCommand([...composeCommand, "-f", COMPOSE_FILE, ...args], {
    quiet: options.quiet,
  });
}

/**
 * 校验 Docker 环境
 */
async function ensureDockerReady(): Promise<void> {
  await runCommand(["docker", "--version"], { quiet: true });
  await getDockerComposeCommand();
}

/**
 * 获取容器状态
 */
async function getContainerState(): Promise<{
  exists: boolean;
  running: boolean;
  health: string | null;
}> {
  try {
    const output = await runCommand(
      [
        "docker",
        "inspect",
        "--format",
        "{{.State.Status}}|{{if .State.Health}}{{.State.Health.Status}}{{else}}none{{end}}",
        DB_CONFIG.containerName,
      ],
      { quiet: true },
    );

    const [status, health] = output.split("|");

    return {
      exists: true,
      running: status === "running",
      health: health ?? null,
    };
  } catch {
    return {
      exists: false,
      running: false,
      health: null,
    };
  }
}

/**
 * 等待数据库健康检查通过
 */
async function waitForDatabaseReady(): Promise<void> {
  const maxAttempts = 24;

  for (let index = 0; index < maxAttempts; index += 1) {
    const state = await getContainerState();
    if (state.running && state.health === "healthy") {
      return;
    }

    await sleep(1000);
  }

  throw new Error("本地数据库启动超时，请执行 bun run db:local logs 查看详情");
}

/**
 * 打印连接信息
 */
function printConnectionInfo(): void {
  console.log(`Profile: local`);
  console.log(`Host: ${DB_CONFIG.host}`);
  console.log(`Port: ${DB_CONFIG.port}`);
  console.log(`Database: ${DB_CONFIG.database}`);
  console.log(`Username: ${DB_CONFIG.user}`);
  console.log(`Password: ${DB_CONFIG.password}`);
  console.log(`Container: ${DB_CONFIG.containerName}`);
  console.log(`DATABASE_URL: ${DB_URL}`);
}

/**
 * 启动本地数据库
 */
async function upDatabase(): Promise<void> {
  printInfo("启动本地数据库运行时");

  const state = await getContainerState();
  if (state.running && state.health === "healthy") {
    printWarning("本地数据库已在运行");
    printConnectionInfo();
    return;
  }

  printInfo("正在创建容器与挂载本地数据卷，首次执行可能需要等待镜像准备");
  await withLoading("执行 docker compose up -d", async () => {
    await runComposeCommand(["up", "-d"], { quiet: true });
  });

  await withLoading("等待 PostgreSQL 健康检查通过", async () => {
    await waitForDatabaseReady();
  });

  printSuccess("本地数据库已就绪");
  printConnectionInfo();
}

/**
 * 停止本地数据库
 */
async function downDatabase(): Promise<void> {
  printInfo("停止本地数据库运行时");

  const state = await getContainerState();
  if (!state.exists) {
    printWarning("本地数据库尚未创建");
    return;
  }

  await withLoading("执行 docker compose down", async () => {
    await runComposeCommand(["down"], { quiet: true });
  });
  printSuccess("本地数据库已停止并释放容器");
}

/**
 * 重置本地数据库
 */
async function resetDatabase(): Promise<void> {
  printInfo("重置本地数据库");

  printWarning(
    "reset 会删除本地数据库容器、网络和数据卷，已有数据会被全部清空",
  );
  printWarning(
    "如果刚切换过 PostgreSQL 主版本，优先执行 reset，以避免旧数据卷与新镜像不兼容",
  );

  await withLoading("清理本地数据库容器、网络与数据卷", async () => {
    await runComposeCommand(["down", "--volumes", "--remove-orphans"], {
      quiet: true,
    });
  });

  await upDatabase();
  printSuccess("本地数据库已重置");
}

/**
 * 查看本地数据库状态
 */
async function showStatus(): Promise<void> {
  const state = await getContainerState();

  if (!state.exists) {
    printWarning("本地数据库尚未创建");
    return;
  }

  if (!state.running) {
    printWarning("本地数据库存在，但当前未运行");
    return;
  }

  printSuccess(`本地数据库运行中，健康状态：${state.health ?? "unknown"}`);
  printConnectionInfo();
}

/**
 * 输出连接字符串
 */
function showUrl(): void {
  console.log(DB_URL);
}

/**
 * 查看数据库日志
 */
async function showLogs(): Promise<void> {
  await runComposeCommand(["logs", "--tail", "100", DB_CONFIG.serviceName], {
    quiet: false,
  });
}

/**
 * 准备本地数据库 schema 与 seed
 */
async function prepareDatabase(): Promise<void> {
  await upDatabase();

  printInfo("生成 Prisma Client");
  await runCommand(
    ["bun", "run", "--filter", "@xdd-zone/nexus", "prisma:generate"],
    {
      cwd: REPO_ROOT,
      env: {
        DATABASE_URL: DB_URL,
      },
    },
  );

  printInfo("同步 Prisma schema");
  await runCommand(
    ["bun", "run", "--filter", "@xdd-zone/nexus", "prisma:push"],
    {
      cwd: REPO_ROOT,
      env: {
        DATABASE_URL: DB_URL,
      },
    },
  );

  printInfo("执行 seed");
  await runCommand(["bun", "run", "--filter", "@xdd-zone/nexus", "seed"], {
    cwd: REPO_ROOT,
    env: {
      DATABASE_URL: DB_URL,
    },
  });

  printSuccess("本地数据库准备完成");
}

/**
 * 输出帮助信息
 */
function showHelp(): void {
  console.log("XDD Zone Core 本地数据库命令");
  console.log("");
  console.log("用法:");
  console.log("  bun run db:local <command>");
  console.log("");
  console.log("命令:");
  console.log("  up       启动本地数据库");
  console.log("  down     停止本地数据库");
  console.log("  reset    重置本地数据库数据卷");
  console.log("  status   查看本地数据库状态");
  console.log("  url      输出 DATABASE_URL");
  console.log("  logs     查看最近 100 行日志");
  console.log("  prepare  启动数据库并执行 prisma:push + seed");
  console.log("  help     查看帮助");
}

/**
 * 程序入口
 */
async function main(): Promise<void> {
  const command = process.argv[2] ?? "help";

  try {
    switch (command) {
      case "up":
        await ensureDockerReady();
        await upDatabase();
        break;
      case "down":
        await ensureDockerReady();
        await downDatabase();
        break;
      case "reset":
        await ensureDockerReady();
        await resetDatabase();
        break;
      case "status":
        await ensureDockerReady();
        await showStatus();
        break;
      case "url":
        showUrl();
        break;
      case "logs":
        await ensureDockerReady();
        await showLogs();
        break;
      case "prepare":
        await ensureDockerReady();
        await prepareDatabase();
        break;
      case "help":
      case "--help":
      case "-h":
        showHelp();
        break;
      default:
        throw new Error(`未知命令：${command}`);
    }
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    printError(message);
    process.exit(1);
  }
}

await main();
