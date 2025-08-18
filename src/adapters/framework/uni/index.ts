import path from 'node:path';
import fs from 'node:fs/promises';
import { execa } from 'execa';
import type { BuildOptions, FrameworkAdapter } from '../../../types/adapters';

async function readJsonSafe(filePath: string): Promise<any | undefined> {
	try {
		const buf = await fs.readFile(filePath, 'utf-8');
		return JSON.parse(buf);
	} catch {
		return undefined;
	}
}

export class UniAppFrameworkAdapter implements FrameworkAdapter {
	name = 'uni-app';

	async detect(cwd: string): Promise<boolean> {
		const pkg = await readJsonSafe(path.resolve(cwd, 'package.json'));
		const deps = {
			...(pkg?.dependencies || {}),
			...(pkg?.devDependencies || {}),
		} as Record<string, string>;

		return Boolean(
			deps['@dcloudio/uni-app'] ||
				deps['@dcloudio/vue-cli-plugin-uni'] ||
				deps['@dcloudio/webpack-uni-pages-loader'] ||
				pkg?.uniApp
		);
	}

	async build(options: BuildOptions): Promise<void> {
		const skip = options.env?.NEXUS_SKIP_BUILD === '1';
		if (skip) {
			options.logger.info('[uni-app] 跳过构建（NEXUS_SKIP_BUILD=1）');
			return;
		}

		options.logger.info('[uni-app] 开始构建...');

		try {
			// 检测构建命令
			const pkg = await readJsonSafe(
				path.resolve(options.cwd, 'package.json')
			);
			const hasUniBuild =
				pkg?.scripts?.['build:mp-weixin'] ||
				pkg?.scripts?.['build:weapp'];

			let buildCommand: string;
			let buildArgs: string[];

			if (hasUniBuild) {
				buildCommand = 'npm';
				buildArgs = [
					'run',
					pkg?.scripts?.['build:mp-weixin']
						? 'build:mp-weixin'
						: 'build:weapp',
				];
			} else {
				// 使用uni CLI
				try {
					await execa('uni', ['--version'], { cwd: options.cwd });
					buildCommand = 'uni';
					buildArgs = ['build', '--platform', 'mp-weixin'];
				} catch {
					// 使用HBuilderX CLI
					try {
						await execa('cli', ['--version'], { cwd: options.cwd });
						buildCommand = 'cli';
						buildArgs = ['build', '--platform', 'mp-weixin'];
					} catch {
						throw new Error(
							'未检测到 uni-app 构建工具，请确保安装了 HBuilderX CLI 或配置了构建脚本'
						);
					}
				}
			}

			options.logger.debug?.(
				`[uni-app] 执行命令: ${buildCommand} ${buildArgs.join(' ')}`
			);

			const result = await execa(buildCommand, buildArgs, {
				cwd: options.cwd,
				stdio: options.logger.debug ? 'inherit' : 'pipe',
				env: {
					...process.env,
					...options.env,
					NODE_ENV: options.mode || 'production',
				},
			});

			if (result.exitCode !== 0) {
				throw new Error(
					`uni-app构建失败 (exit code: ${result.exitCode})`
				);
			}

			options.logger.info('[uni-app] 构建完成');
		} catch (error) {
			const errorMessage =
				error instanceof Error ? error.message : String(error);
			options.logger.error('[uni-app] 构建失败', { error: errorMessage });

			// Provide helpful error suggestions
			if (
				errorMessage.includes('uni-app') ||
				errorMessage.includes('cli')
			) {
				options.logger.error(
					'[uni-app] 提示: 请确保已安装 uni-app CLI 或配置了构建脚本'
				);
			} else if (errorMessage.includes('vue.config')) {
				options.logger.error(
					'[uni-app] 提示: 请检查 vue.config.js 配置'
				);
			} else if (errorMessage.includes('dependencies')) {
				options.logger.error(
					'[uni-app] 提示: 请检查项目依赖是否已正确安装'
				);
			} else if (errorMessage.includes('HBuilderX')) {
				options.logger.error(
					'[uni-app] 提示: 如使用 HBuilderX，请确保已正确配置 CLI 工具'
				);
			}

			throw error;
		}
	}

	async getOutputPath(options: BuildOptions): Promise<string> {
		let outputDir = 'dist/build/mp-weixin';

		try {
			// 1. 优先检查vue.config.js配置
			const vueConfigPath = path.resolve(options.cwd, 'vue.config.js');
			try {
				const vueConfig = await import(vueConfigPath);
				if (vueConfig?.default?.pluginOptions?.['uni-app']?.outputDir) {
					outputDir =
						vueConfig.default.pluginOptions['uni-app'].outputDir;
				} else if (vueConfig?.pluginOptions?.['uni-app']?.outputDir) {
					outputDir = vueConfig.pluginOptions['uni-app'].outputDir;
				}
			} catch {
				// 继续尝试其他方式
			}

			// 2. 检查package.json中的uni-app配置
			const pkg = await readJsonSafe(
				path.resolve(options.cwd, 'package.json')
			);
			if (pkg?.uniApp?.outputDir) {
				outputDir = pkg.uniApp.outputDir;
			}

			// 3. 基于mode设置输出目录
			if (options.mode === 'development') {
				outputDir = outputDir.replace('/build/', '/dev/');
			}

			const candidate = path.resolve(options.cwd, outputDir);
			options.logger.debug?.(`[uni-app] 产物目录: ${candidate}`);
			return candidate;
		} catch {
			// 回退到默认路径
			const candidate = path.resolve(
				options.cwd,
				'dist',
				'build',
				'mp-weixin'
			);
			options.logger.debug?.(`[uni-app] 使用默认产物目录: ${candidate}`);
			return candidate;
		}
	}
}

export function createUniAppAdapter(): FrameworkAdapter {
	return new UniAppFrameworkAdapter();
}
