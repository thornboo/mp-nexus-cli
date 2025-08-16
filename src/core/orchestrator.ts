import path from 'node:path';
import fs from 'node:fs/promises';
import qr from 'qrcode-terminal';
import type { CLIOptions, Logger, NexusConfig } from '../types';
import type { PreviewResult, UploadResult } from '../types/adapters';
import { createWeappAdapter } from '../adapters/platform/weapp';
import { createTaroAdapter } from '../adapters/framework/taro';
import { createUniAppAdapter } from '../adapters/framework/uni';
import { ExitCodes } from '../utils/exit-codes';
import { Errors, handleError } from '../utils/errors';

export interface RunContext extends CLIOptions {
  logger: Logger;
}

async function loadUserConfig(configPath?: string): Promise<Partial<NexusConfig>> {
  const resolved = configPath ?? path.resolve(process.cwd(), 'mp-nexus.config.js');
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const cfg = require(resolved);
    return cfg && cfg.default ? cfg.default : cfg;
  } catch {
    return {};
  }
}

function mergeConfig(cli: RunContext, fileCfg: Partial<NexusConfig>): NexusConfig {
  const merged: NexusConfig = {
    projectPath: fileCfg.projectPath ?? '.',
    platform: fileCfg.platform ?? 'weapp',
    appId: fileCfg.appId ?? process.env.MP_APP_ID ?? '',
    privateKeyPath: fileCfg.privateKeyPath ?? process.env.MP_PRIVATE_KEY_PATH ?? 'private.key',
    outputDir: fileCfg.outputDir ?? 'dist/weapp',
    ciOptions: fileCfg.ciOptions ?? {},
    projectType: fileCfg.projectType,
    notify: fileCfg.notify,
  };

  if (cli.ver) merged.ciOptions = { ...(merged.ciOptions || {}), version: cli.ver } as any;
  if (cli.desc) merged.ciOptions = { ...(merged.ciOptions || {}), desc: cli.desc } as any;
  return merged;
}

function assertMinimalConfig(cfg: NexusConfig) {
  if (!cfg.appId) {
    throw Errors.invalidAppId('未提供');
  }
  if (!cfg.privateKeyPath) {
    throw Errors.invalidPrivateKey('未提供');
  }
}

async function ensurePaths(cfg: NexusConfig) {
  const projectRoot = path.resolve(process.cwd(), cfg.projectPath || '.');
  const outputPath = path.resolve(projectRoot, cfg.outputDir || 'dist/weapp');
  // Best-effort check
  try {
    await fs.access(projectRoot);
  } catch {
    throw Errors.fileNotFound(projectRoot);
  }
  return { projectRoot, outputPath };
}

async function detectFrameworkOutput(cwd: string, logger: Logger): Promise<string | undefined> {
  // 检测顺序：Taro -> uni-app -> 其他
  const taro = createTaroAdapter();
  const uni = createUniAppAdapter();

  if (await taro.detect(cwd)) {
    logger.info(`[framework] 检测到 Taro 项目`);
    const out = await taro.getOutputPath({ cwd, logger });
    return out;
  }
  
  if (await uni.detect(cwd)) {
    logger.info(`[framework] 检测到 uni-app 项目`);
    const out = await uni.getOutputPath({ cwd, logger });
    return out;
  }
  
  logger.warn('[framework] 未检测到受支持的框架，使用配置 outputDir');
  return undefined;
}

export async function runPreview(ctx: RunContext): Promise<PreviewResult> {
  const fileCfg = await loadUserConfig(ctx.config);
  const cfg = mergeConfig(ctx, fileCfg);
  const { projectRoot, outputPath: configuredOutput } = await ensurePaths(cfg);

  const platform = createWeappAdapter();

  if (ctx.dryRun) {
    const detectedOut = await detectFrameworkOutput(projectRoot, ctx.logger);
    const outputPath = detectedOut ?? configuredOutput;
    ctx.logger.info('[dry-run] 预览流程', { projectRoot, outputPath, platform: platform.name });
    return { success: true, qrcodeImagePath: 'dry-run://qrcode' };
  }
  assertMinimalConfig(cfg);

  // 构建（若检测到支持的框架）
  const taro = createTaroAdapter();
  const uni = createUniAppAdapter();
  let outputPath = configuredOutput;
  
  if (await taro.detect(projectRoot)) {
    await taro.build({ cwd: projectRoot, mode: ctx.mode, logger: ctx.logger });
    outputPath = await taro.getOutputPath({ cwd: projectRoot, mode: ctx.mode, logger: ctx.logger });
  } else if (await uni.detect(projectRoot)) {
    await uni.build({ cwd: projectRoot, mode: ctx.mode, logger: ctx.logger });
    outputPath = await uni.getOutputPath({ cwd: projectRoot, mode: ctx.mode, logger: ctx.logger });
  }

  const res = await platform.preview({
    projectPath: outputPath,
    appId: cfg.appId,
    privateKeyPath: cfg.privateKeyPath,
    version: ctx.ver,
    desc: ctx.desc,
    logger: ctx.logger,
    ciOptions: cfg.ciOptions,
    qrcodeOutputPath: path.resolve(projectRoot, 'preview-qrcode.png'),
  });

  if (res.success) {
    ctx.logger.info('预览完成', res);
    
    // 在终端显示二维码
    if (res.qrcodeImagePath) {
      try {
        await fs.access(res.qrcodeImagePath);
        console.log('\n📱 预览二维码：\n');
        qr.generate(res.qrcodeImagePath, { small: true });
        console.log(`\n二维码已保存至: ${res.qrcodeImagePath}\n`);
      } catch {
        ctx.logger.warn('二维码文件不存在，无法在终端显示');
      }
    }
  } else {
    ctx.logger.error('预览失败', res);
  }
  return res;
}

export async function runDeploy(ctx: RunContext): Promise<UploadResult> {
  const fileCfg = await loadUserConfig(ctx.config);
  const cfg = mergeConfig(ctx, fileCfg);
  const { projectRoot, outputPath: configuredOutput } = await ensurePaths(cfg);

  const platform = createWeappAdapter();

  if (ctx.dryRun) {
    const detectedOut = await detectFrameworkOutput(projectRoot, ctx.logger);
    const outputPath = detectedOut ?? configuredOutput;
    ctx.logger.info('[dry-run] 部署流程', { projectRoot, outputPath, platform: platform.name });
    return { success: true, version: ctx.ver || 'dry-run' };
  }
  assertMinimalConfig(cfg);

  // 构建（若检测到支持的框架）
  const taro = createTaroAdapter();
  const uni = createUniAppAdapter();
  let outputPath = configuredOutput;
  
  if (await taro.detect(projectRoot)) {
    await taro.build({ cwd: projectRoot, mode: ctx.mode, logger: ctx.logger });
    outputPath = await taro.getOutputPath({ cwd: projectRoot, mode: ctx.mode, logger: ctx.logger });
  } else if (await uni.detect(projectRoot)) {
    await uni.build({ cwd: projectRoot, mode: ctx.mode, logger: ctx.logger });
    outputPath = await uni.getOutputPath({ cwd: projectRoot, mode: ctx.mode, logger: ctx.logger });
  }

  const res = await platform.upload({
    projectPath: outputPath,
    appId: cfg.appId,
    privateKeyPath: cfg.privateKeyPath,
    version: ctx.ver,
    desc: ctx.desc,
    logger: ctx.logger,
    ciOptions: cfg.ciOptions,
  });

  if (res.success) {
    ctx.logger.info('部署完成', res);
  } else {
    ctx.logger.error('部署失败', res);
  }
  return res;
}


