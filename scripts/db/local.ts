#!/usr/bin/env bun

/**
 * 本地数据库 CLI
 *
 * 用于管理 XDD Zone Core 的本地 PostgreSQL。
 * 入口：`bun run db <command>`
 */

import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";

type ContainerState = {
  exists: boolean;
  running: boolean;
  health: string | null;
};

type CommandDefinition = {
  name:
    | "up"
    | "down"
    | "reset"
    | "status"
    | "url"
    | "logs"
    | "prepare"
    | "help";
  summary: string;
  usage: string;
  aliases?: string[];
  needsDocker?: boolean;
  run: () => Promise<void>;
};

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
} as const;

const DB_URL = `postgresql://${DB_CONFIG.user}:${DB_CONFIG.password}@${DB_CONFIG.host}:${DB_CONFIG.port}/${DB_CONFIG.database}`;

const colors = {
  blue: "\x1B[34m",
  green: "\x1B[32m",
  yellow: "\x1B[33m",
  red: "\x1B[31m",
  reset: "\x1B[0m",
} as const;

const loadingFrames = ["-", "\\", "|", "/"];

class LocalDatabaseCli {
  private readonly commands: CommandDefinition[] = [
    {
      name: "up",
      summary: "启动本地数据库",
      usage: "bun run db up",
      aliases: ["start"],
      needsDocker: true,
      run: async () => await this.upDatabase(),
    },
    {
      name: "down",
      summary: "停止本地数据库",
      usage: "bun run db down",
      aliases: ["stop"],
      needsDocker: true,
      run: async () => await this.downDatabase(),
    },
    {
      name: "reset",
      summary: "重置本地数据库数据卷",
      usage: "bun run db reset",
      needsDocker: true,
      run: async () => await this.resetDatabase(),
    },
    {
      name: "status",
      summary: "查看本地数据库状态",
      usage: "bun run db status",
      aliases: ["ps"],
      needsDocker: true,
      run: async () => await this.showStatus(),
    },
    {
      name: "url",
      summary: "输出 DATABASE_URL",
      usage: "bun run db url",
      run: async () => this.showUrl(),
    },
    {
      name: "logs",
      summary: "查看最近 100 行日志",
      usage: "bun run db logs",
      needsDocker: true,
      run: async () => await this.showLogs(),
    },
    {
      name: "prepare",
      summary: "启动数据库并执行 prisma:push + seed",
      usage: "bun run db prepare",
      needsDocker: true,
      run: async () => await this.prepareDatabase(),
    },
    {
      name: "help",
      summary: "查看帮助",
      usage: "bun run db help",
      aliases: ["local", "-h", "--help"],
      run: async () => this.showHelp(),
    },
  ];

  /**
   * 执行 CLI
   * @param argv 命令行参数
   */
  async run(argv: string[] = process.argv.slice(2)): Promise<void> {
    const commandName = this.getCommandName(argv);
    const command = this.resolveCommand(commandName);

    if (!command) {
      throw new Error(`未知命令：${commandName}`);
    }

    try {
      if (command.needsDocker) {
        await this.ensureDockerReady();
      }

      await command.run();
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.printError(message);
      process.exit(1);
    }
  }

  /**
   * 解析命令名
   * @param argv 命令行参数
   * @returns 命令名
   */
  private getCommandName(argv: string[]): string {
    const [firstArg, secondArg] = argv;

    if (firstArg === "local") {
      return secondArg ?? "help";
    }

    return firstArg ?? "help";
  }

  /**
   * 查找命令定义
   * @param input 命令名或别名
   * @returns 命令定义
   */
  private resolveCommand(input: string): CommandDefinition | undefined {
    return this.commands.find(
      (command) => command.name === input || command.aliases?.includes(input),
    );
  }

  /**
   * 输出信息日志
   * @param message 日志内容
   */
  private printInfo(message: string): void {
    console.log(`${colors.blue}[db]${colors.reset} ${message}`);
  }

  /**
   * 输出成功日志
   * @param message 日志内容
   */
  private printSuccess(message: string): void {
    console.log(`${colors.green}[success]${colors.reset} ${message}`);
  }

  /**
   * 输出警告日志
   * @param message 日志内容
   */
  private printWarning(message: string): void {
    console.warn(`${colors.yellow}[warning]${colors.reset} ${message}`);
  }

  /**
   * 输出错误日志
   * @param message 日志内容
   */
  private printError(message: string): void {
    console.error(`${colors.red}[error]${colors.reset} ${message}`);
  }

  /**
   * 在长时间任务执行期间输出 loading 状态
   * @param message 提示信息
   * @param action 任务函数
   */
  private async withLoading<T>(
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
  private sleep(ms: number): Promise<void> {
    return new Promise((resolveDelay) => setTimeout(resolveDelay, ms));
  }

  /**
   * 获取 Docker Compose 命令前缀
   */
  private async getDockerComposeCommand(): Promise<string[]> {
    try {
      await this.runCommand(["docker", "compose", "version"], { quiet: true });
      return ["docker", "compose"];
    } catch {
      await this.runCommand(["docker-compose", "--version"], { quiet: true });
      return ["docker-compose"];
    }
  }

  /**
   * 执行命令
   * @param args 命令参数
   * @param options 执行选项
   */
  private async runCommand(
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
  private async runComposeCommand(
    args: string[],
    options: { quiet?: boolean } = {},
  ): Promise<string> {
    const composeCommand = await this.getDockerComposeCommand();

    return await this.runCommand(
      [...composeCommand, "-f", COMPOSE_FILE, ...args],
      {
        quiet: options.quiet,
      },
    );
  }

  /**
   * 校验 Docker 环境
   */
  private async ensureDockerReady(): Promise<void> {
    await this.runCommand(["docker", "--version"], { quiet: true });
    await this.getDockerComposeCommand();
  }

  /**
   * 获取容器状态
   */
  private async getContainerState(): Promise<ContainerState> {
    try {
      const output = await this.runCommand(
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
  private async waitForDatabaseReady(): Promise<void> {
    const maxAttempts = 24;

    for (let index = 0; index < maxAttempts; index += 1) {
      const state = await this.getContainerState();
      if (state.running && state.health === "healthy") {
        return;
      }

      await this.sleep(1000);
    }

    throw new Error("本地数据库启动超时，请执行 bun run db logs 查看详情");
  }

  /**
   * 打印连接信息
   */
  private printConnectionInfo(): void {
    console.log("Profile: local");
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
  private async upDatabase(): Promise<void> {
    this.printInfo("启动本地数据库运行时");

    const state = await this.getContainerState();
    if (state.running && state.health === "healthy") {
      this.printWarning("本地数据库已在运行");
      this.printConnectionInfo();
      return;
    }

    this.printInfo(
      "正在创建容器与挂载本地数据卷，首次执行可能需要等待镜像准备",
    );
    await this.withLoading("执行 docker compose up -d", async () => {
      await this.runComposeCommand(["up", "-d"], { quiet: true });
    });

    await this.withLoading("等待 PostgreSQL 健康检查通过", async () => {
      await this.waitForDatabaseReady();
    });

    this.printSuccess("本地数据库已就绪");
    this.printConnectionInfo();
  }

  /**
   * 停止本地数据库
   */
  private async downDatabase(): Promise<void> {
    this.printInfo("停止本地数据库运行时");

    const state = await this.getContainerState();
    if (!state.exists) {
      this.printWarning("本地数据库尚未创建");
      return;
    }

    await this.withLoading("执行 docker compose down", async () => {
      await this.runComposeCommand(["down"], { quiet: true });
    });

    this.printSuccess("本地数据库已停止并释放容器");
  }

  /**
   * 重置本地数据库
   */
  private async resetDatabase(): Promise<void> {
    this.printInfo("重置本地数据库");
    this.printWarning(
      "reset 会删除本地数据库容器、网络和数据卷，已有数据会被全部清空",
    );
    this.printWarning(
      "如果刚切换过 PostgreSQL 主版本，优先执行 reset，以避免旧数据卷与新镜像不兼容",
    );

    await this.withLoading("清理本地数据库容器、网络与数据卷", async () => {
      await this.runComposeCommand(["down", "--volumes", "--remove-orphans"], {
        quiet: true,
      });
    });

    await this.upDatabase();
    this.printSuccess("本地数据库已重置");
  }

  /**
   * 查看本地数据库状态
   */
  private async showStatus(): Promise<void> {
    const state = await this.getContainerState();

    if (!state.exists) {
      this.printWarning("本地数据库尚未创建");
      return;
    }

    if (!state.running) {
      this.printWarning("本地数据库存在，但当前未运行");
      return;
    }

    this.printSuccess(
      `本地数据库运行中，健康状态：${state.health ?? "unknown"}`,
    );
    this.printConnectionInfo();
  }

  /**
   * 输出连接字符串
   */
  private showUrl(): void {
    console.log(DB_URL);
  }

  /**
   * 查看数据库日志
   */
  private async showLogs(): Promise<void> {
    await this.runComposeCommand(
      ["logs", "--tail", "100", DB_CONFIG.serviceName],
      {
        quiet: false,
      },
    );
  }

  /**
   * 准备本地数据库 schema 与 seed
   */
  private async prepareDatabase(): Promise<void> {
    await this.upDatabase();

    this.printInfo("生成 Prisma Client");
    await this.runCommand(
      ["bun", "run", "--filter", "@xdd-zone/nexus", "prisma:generate"],
      {
        cwd: REPO_ROOT,
        env: {
          DATABASE_URL: DB_URL,
        },
      },
    );

    this.printInfo("同步 Prisma schema");
    await this.runCommand(
      ["bun", "run", "--filter", "@xdd-zone/nexus", "prisma:push"],
      {
        cwd: REPO_ROOT,
        env: {
          DATABASE_URL: DB_URL,
        },
      },
    );

    this.printInfo("执行 seed");
    await this.runCommand(
      ["bun", "run", "--filter", "@xdd-zone/nexus", "seed"],
      {
        cwd: REPO_ROOT,
        env: {
          DATABASE_URL: DB_URL,
        },
      },
    );

    this.printSuccess("本地数据库准备完成");
  }

  /**
   * 输出帮助信息
   */
  private showHelp(): void {
    console.log("XDD Zone Core 本地数据库 CLI");
    console.log("");
    console.log("用法:");
    console.log("  bun run db <command>");
    console.log("");
    console.log("命令:");

    for (const command of this.commands) {
      console.log(`  ${command.name.padEnd(8)} ${command.summary}`);
    }

    console.log("");
    console.log("示例:");
    console.log("  bun run db up");
    console.log("  bun run db prepare");
    console.log("  bun run db logs");
    console.log("");
    console.log("说明:");
    console.log(
      "  - 当前 CLI 管理 scripts/db/docker-compose.local.yml 里的本地 PostgreSQL",
    );
    console.log(`  - 默认连接地址：${DB_URL}`);
  }
}

await new LocalDatabaseCli().run();
