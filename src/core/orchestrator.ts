import path from 'node:path';
import fs from 'node:fs/promises';
import type { CLIOptions, Logger, NexusConfig } from '../types';
import type { PreviewResult, UploadResult } from '../types/adapters';
import { createWeappAdapter } from '../adapters/platform/weapp';
import { createTaroAdapter } from '../adapters/framework/taro';

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
  if (!cfg.appId) throw new Error('缺少 appId：请在配置或环境变量 MP_APP_ID 中提供');
  if (!cfg.privateKeyPath) throw new Error('缺少 privateKeyPath');
}

async function ensurePaths(cfg: NexusConfig) {
  const projectRoot = path.resolve(process.cwd(), cfg.projectPath || '.');
  const outputPath = path.resolve(projectRoot, cfg.outputDir || 'dist/weapp');
  // Best-effort check
  try {
    await fs.access(projectRoot);
  } catch {
    throw new Error(`项目目录不存在：${projectRoot}`);
  }
  return { projectRoot, outputPath };
}

async function detectFrameworkOutput(cwd: string, logger: Logger): Promise<string | undefined> {
  const taro = createTaroAdapter();
  if (await taro.detect(cwd)) {
    logger.info(`[framework] 检测到 Taro 项目`);
    const out = await taro.getOutputPath({ cwd, logger });
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
  let outputPath = configuredOutput;
  if (await taro.detect(projectRoot)) {
    await taro.build({ cwd: projectRoot, mode: ctx.mode, logger: ctx.logger });
    outputPath = await taro.getOutputPath({ cwd: projectRoot, mode: ctx.mode, logger: ctx.logger });
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
  let outputPath = configuredOutput;
  if (await taro.detect(projectRoot)) {
    await taro.build({ cwd: projectRoot, mode: ctx.mode, logger: ctx.logger });
    outputPath = await taro.getOutputPath({ cwd: projectRoot, mode: ctx.mode, logger: ctx.logger });
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


