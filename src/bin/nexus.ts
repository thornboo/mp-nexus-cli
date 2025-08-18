import { Command } from 'commander';
import path from 'node:path';
import fs from 'node:fs';
import dotenv from 'dotenv';
import { runPreview, runDeploy } from '../core/orchestrator';
import { ExitCodes } from '../utils/exit-codes';
import { handleError } from '../utils/errors';
import { createLogger } from '../utils/logger';

const program = new Command();

program
  .name('nexus')
  .description('mp-nexus-cli: 统一小程序项目的一键预览/部署 CLI')
  .version('0.0.0-mvp');

function loadEnv(mode?: string) {
  dotenv.config();
  if (mode) {
    const envFile = `.env.${mode}`;
    if (fs.existsSync(envFile)) {
      dotenv.config({ path: envFile });
      process.env.NODE_ENV = mode;
    }
  }
}

// createLogger is now imported from utils/logger

function resolveConfigPath(config?: string): string | undefined {
  if (!config) return undefined;
  const p = path.isAbsolute(config) ? config : path.resolve(process.cwd(), config);
  return p;
}

function collectCommonOptions(cmd: Command) {
  return cmd
    .option('--mode <env>', '环境模式（决定加载 .env.<env>）')
    .option('--desc <text>', '版本描述')
    .option('--ver <x.y.z>', '版本号')
    .option('--config <path>', '自定义配置文件路径')
    .option('--dry-run', '仅打印将执行的步骤，不真正调用 CI')
    .option('--verbose', '输出更详细日志')
    .option('--json', '输出结构化 JSON 格式结果');
}

collectCommonOptions(
  program
    .command('preview')
    .description('构建并生成预览（终端可渲染二维码）')
    .action(async (options) => {
      try {
        loadEnv(options.mode);
        const logger = createLogger(options.verbose);
        await runPreview({
          mode: options.mode,
          desc: options.desc,
          ver: options.ver,
          config: resolveConfigPath(options.config),
          dryRun: !!options.dryRun,
          verbose: !!options.verbose,
          json: !!options.json,
          logger,
        });
        process.exit(ExitCodes.SUCCESS);
      } catch (err) {
        const exitCode = handleError(err, console);
        process.exit(exitCode);
      }
    })
);

collectCommonOptions(
  program
    .command('deploy')
    .description('构建并上传为新版本')
    .action(async (options) => {
      try {
        loadEnv(options.mode);
        const logger = createLogger(options.verbose);
        await runDeploy({
          mode: options.mode,
          desc: options.desc,
          ver: options.ver,
          config: resolveConfigPath(options.config),
          dryRun: !!options.dryRun,
          verbose: !!options.verbose,
          json: !!options.json,
          logger,
        });
        process.exit(ExitCodes.SUCCESS);
      } catch (err) {
        const exitCode = handleError(err, console);
        process.exit(exitCode);
      }
    })
);

program.parseAsync(process.argv);


