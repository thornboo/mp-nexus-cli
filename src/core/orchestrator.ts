import path from 'node:path';
import fs from 'node:fs/promises';
import type { CLIOptions, Logger, NexusConfig } from '../types';
import type { PreviewResult, UploadResult } from '../types/adapters';
import { createWeappAdapter } from '../adapters/platform/weapp';
import { createTaroAdapter } from '../adapters/framework/taro';
import { createUniAppAdapter } from '../adapters/framework/uni';
import { ExitCodes } from '../utils/exit-codes';
import { Errors, handleError } from '../utils/errors';
import { getGitInfo, applyGitDefaults } from '../utils/git';
import { createOutputFormatter } from '../utils/output';
import { loadUserConfig } from '../utils/config-loader';
import { mergeConfig } from '../utils/config-merger';
import { assertMinimalConfig } from '../utils/config-validator';
import { ensurePaths } from '../utils/path-resolver';

export interface RunContext extends CLIOptions {
	logger: Logger;
}

// Configuration utilities moved to separate modules for better testability

async function detectFrameworkOutput(
	cwd: string,
	logger: Logger
): Promise<string | undefined> {
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
	const outputFormatter = createOutputFormatter(ctx.logger);
	let detectedFramework: string | undefined;
	let finalOutputPath: string | undefined;

	try {
		const fileCfg = await loadUserConfig(ctx.config);
		const cfg = mergeConfig(ctx, fileCfg);
		const { projectRoot, outputPath: configuredOutput } = await ensurePaths(
			cfg
		);

		const platform = createWeappAdapter();

		if (ctx.dryRun) {
			const detectedOut = await detectFrameworkOutput(
				projectRoot,
				ctx.logger
			);
			const outputPath = detectedOut ?? configuredOutput;
			ctx.logger.info('[dry-run] 预览流程', {
				projectRoot,
				outputPath,
				platform: platform.name,
			});
			return { success: true, qrcodeImagePath: 'dry-run://qrcode' };
		}
		assertMinimalConfig(cfg);

		// Get Git information for auto-defaults
		const gitInfo = await getGitInfo(projectRoot, ctx.logger);
		const { desc, ver } = applyGitDefaults(
			{ desc: ctx.desc, ver: ctx.ver },
			gitInfo
		);

		if (desc && !ctx.desc) {
			ctx.logger.info(
				`[git] Using commit message as description: ${desc}`
			);
		}
		if (ver && !ctx.ver) {
			ctx.logger.info(`[git] Using package.json version: ${ver}`);
		}

		// 构建（若检测到支持的框架）
		const taro = createTaroAdapter();
		const uni = createUniAppAdapter();
		let outputPath = configuredOutput;

		if (await taro.detect(projectRoot)) {
			detectedFramework = 'taro';
			await taro.build({
				cwd: projectRoot,
				mode: ctx.mode,
				logger: ctx.logger,
			});
			outputPath = await taro.getOutputPath({
				cwd: projectRoot,
				mode: ctx.mode,
				logger: ctx.logger,
			});
		} else if (await uni.detect(projectRoot)) {
			detectedFramework = 'uni-app';
			await uni.build({
				cwd: projectRoot,
				mode: ctx.mode,
				logger: ctx.logger,
			});
			outputPath = await uni.getOutputPath({
				cwd: projectRoot,
				mode: ctx.mode,
				logger: ctx.logger,
			});
		}

		finalOutputPath = outputPath;

		const res = await platform.preview({
			projectPath: outputPath,
			appId: cfg.appId,
			privateKeyPath: cfg.privateKeyPath,
			version: ver,
			desc: desc,
			logger: ctx.logger,
			ciOptions: cfg.ciOptions,
			qrcodeOutputPath: path.resolve(projectRoot, 'preview-qrcode.png'),
		});

		// Format successful output
		outputFormatter.formatSuccess(res, {
			json: ctx.json,
			verbose: ctx.verbose,
			operation: 'preview',
			metadata: {
				framework: detectedFramework,
				platform: platform.name,
				version: ver,
				description: desc,
				projectPath: projectRoot,
				outputPath: finalOutputPath,
			},
		});

		return res;
	} catch (error) {
		// Format error output
		outputFormatter.formatError(error, {
			json: ctx.json,
			verbose: ctx.verbose,
			operation: 'preview',
			metadata: {
				framework: detectedFramework,
				platform: 'weapp',
				projectPath: process.cwd(),
				outputPath: finalOutputPath,
			},
		});

		throw error;
	}
}

export async function runDeploy(ctx: RunContext): Promise<UploadResult> {
	const outputFormatter = createOutputFormatter(ctx.logger);
	let detectedFramework: string | undefined;
	let finalOutputPath: string | undefined;

	try {
		const fileCfg = await loadUserConfig(ctx.config);
		const cfg = mergeConfig(ctx, fileCfg);
		const { projectRoot, outputPath: configuredOutput } = await ensurePaths(
			cfg
		);

		const platform = createWeappAdapter();

		if (ctx.dryRun) {
			const detectedOut = await detectFrameworkOutput(
				projectRoot,
				ctx.logger
			);
			const outputPath = detectedOut ?? configuredOutput;
			ctx.logger.info('[dry-run] 部署流程', {
				projectRoot,
				outputPath,
				platform: platform.name,
			});
			return { success: true, version: ctx.ver || 'dry-run' };
		}
		assertMinimalConfig(cfg);

		// Get Git information for auto-defaults
		const gitInfo = await getGitInfo(projectRoot, ctx.logger);
		const { desc, ver } = applyGitDefaults(
			{ desc: ctx.desc, ver: ctx.ver },
			gitInfo
		);

		if (desc && !ctx.desc) {
			ctx.logger.info(
				`[git] Using commit message as description: ${desc}`
			);
		}
		if (ver && !ctx.ver) {
			ctx.logger.info(`[git] Using package.json version: ${ver}`);
		}

		// 构建（若检测到支持的框架）
		const taro = createTaroAdapter();
		const uni = createUniAppAdapter();
		let outputPath = configuredOutput;

		if (await taro.detect(projectRoot)) {
			detectedFramework = 'taro';
			await taro.build({
				cwd: projectRoot,
				mode: ctx.mode,
				logger: ctx.logger,
			});
			outputPath = await taro.getOutputPath({
				cwd: projectRoot,
				mode: ctx.mode,
				logger: ctx.logger,
			});
		} else if (await uni.detect(projectRoot)) {
			detectedFramework = 'uni-app';
			await uni.build({
				cwd: projectRoot,
				mode: ctx.mode,
				logger: ctx.logger,
			});
			outputPath = await uni.getOutputPath({
				cwd: projectRoot,
				mode: ctx.mode,
				logger: ctx.logger,
			});
		}

		finalOutputPath = outputPath;

		const res = await platform.upload({
			projectPath: outputPath,
			appId: cfg.appId,
			privateKeyPath: cfg.privateKeyPath,
			version: ver,
			desc: desc,
			logger: ctx.logger,
			ciOptions: cfg.ciOptions,
		});

		// Format successful output
		outputFormatter.formatSuccess(res, {
			json: ctx.json,
			verbose: ctx.verbose,
			operation: 'deploy',
			metadata: {
				framework: detectedFramework,
				platform: platform.name,
				version: ver,
				description: desc,
				projectPath: projectRoot,
				outputPath: finalOutputPath,
			},
		});

		return res;
	} catch (error) {
		// Format error output
		outputFormatter.formatError(error, {
			json: ctx.json,
			verbose: ctx.verbose,
			operation: 'deploy',
			metadata: {
				framework: detectedFramework,
				platform: 'weapp',
				projectPath: process.cwd(),
				outputPath: finalOutputPath,
			},
		});

		throw error;
	}
}
