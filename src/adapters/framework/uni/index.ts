import path from 'node:path';
import fs from 'node:fs/promises';
import { execa } from 'execa';
import type { BuildOptions, FrameworkAdapter } from '../../../types/adapters';
import { Errors } from '../../../utils/errors';
import { withRetry, RetryPresets } from '../../../utils/retry';
import { translate } from '../../../utils/i18n';

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
		if (!pkg) return false;

		const deps = {
			...(pkg?.dependencies || {}),
			...(pkg?.devDependencies || {}),
		} as Record<string, string>;

		// Check for uni-app dependencies
		const hasUniDeps = Boolean(
			deps['@dcloudio/uni-app'] ||
				deps['@dcloudio/vue-cli-plugin-uni'] ||
				deps['@dcloudio/webpack-uni-pages-loader'] ||
				deps['@dcloudio/uni-cli-shared'] ||
				deps['@dcloudio/vite-plugin-uni']
		);

		// Check for uni-app configuration
		const hasUniConfig = Boolean(pkg?.uniApp);

		// Check for uni-app specific files
		const manifestPath = path.resolve(cwd, 'src/manifest.json');
		const pagesPath = path.resolve(cwd, 'src/pages.json');
		let hasUniFiles = false;

		try {
			await fs.access(manifestPath);
			await fs.access(pagesPath);
			hasUniFiles = true;
		} catch {
			// Files don't exist
		}

		return hasUniDeps || hasUniConfig || hasUniFiles;
	}

	async build(options: BuildOptions): Promise<void> {
		const skip = options.env?.NEXUS_SKIP_BUILD === '1';
		if (skip) {
			options.logger.info('framework.uniapp.buildSkipped');
			return;
		}

		options.logger.info('framework.uniapp.buildStart');

		try {
			// Validate project configuration
			await this.validateProjectConfiguration(
				options.cwd,
				options.logger
			);
			// Detect build command strategy
			const pkg = await readJsonSafe(
				path.resolve(options.cwd, 'package.json')
			);

			const buildStrategy = await this.detectBuildStrategy(
				options.cwd,
				pkg,
				options
			);

			// Execute build with retry mechanism
			await withRetry(
				async () => {
					await this.executeBuild(buildStrategy, options);
				},
				{ ...RetryPresets.build, logger: options.logger },
				'uni-app build'
			);

			options.logger.info('framework.uniapp.buildCompleted');
		} catch (error) {
			// Enhanced error classification with uni-app specific troubleshooting
			const classifiedError = this.classifyBuildError(error);
			throw classifiedError;
		}
	}

	private async detectBuildStrategy(
		cwd: string,
		pkg: any,
		options?: BuildOptions
	): Promise<{
		command: string;
		args: string[];
		description: string;
	}> {
		// Determine target platform from configuration or default to mp-weixin
		const targetPlatform = this.getTargetPlatform(options);

		// Map environment modes to uni-app build modes
		const buildMode = this.getBuildMode(options?.mode);

		// Strategy 1: Check for npm scripts
		const commonScripts = [
			`build:${targetPlatform}`,
			`build:${targetPlatform.replace('mp-', '')}`,
			'build:mp-weixin',
			'build:weapp',
			'build:mp',
			'uni:build:mp-weixin',
			`uni:build:${targetPlatform}`,
		];

		for (const script of commonScripts) {
			if (pkg?.scripts?.[script]) {
				return {
					command: 'npm',
					args: ['run', script],
					description: `npm run ${script}`,
				};
			}
		}

		// Strategy 2: Try uni CLI
		try {
			await withRetry(
				async () => {
					const result = await execa('uni', ['--version'], { cwd });
					if (result.exitCode !== 0) {
						throw Errors.buildToolNotFound('uni CLI');
					}
				},
				{ ...RetryPresets.quick },
				'uni CLI detection'
			);

			return {
				command: 'uni',
				args: [
					'build',
					'--platform',
					targetPlatform,
					'--mode',
					buildMode,
				],
				description: `uni build --platform ${targetPlatform} --mode ${buildMode}`,
			};
		} catch {
			// Continue to next strategy
		}

		// Strategy 3: Try Vue CLI with uni plugin
		try {
			await withRetry(
				async () => {
					const result = await execa(
						'vue-cli-service',
						['--version'],
						{ cwd }
					);
					if (result.exitCode !== 0) {
						throw Errors.buildToolNotFound('Vue CLI');
					}
				},
				{ ...RetryPresets.quick },
				'Vue CLI detection'
			);

			return {
				command: 'vue-cli-service',
				args: [
					'uni-build',
					'--mode',
					buildMode,
					'--platform',
					targetPlatform,
				],
				description: `vue-cli-service uni-build --platform ${targetPlatform} --mode ${buildMode}`,
			};
		} catch {
			// Continue to next strategy
		}

		// Strategy 4: Try HBuilderX CLI
		try {
			await withRetry(
				async () => {
					const result = await execa('cli', ['--version'], { cwd });
					if (result.exitCode !== 0) {
						throw Errors.buildToolNotFound('HBuilderX CLI');
					}
				},
				{ ...RetryPresets.quick },
				'HBuilderX CLI detection'
			);

			return {
				command: 'cli',
				args: [
					'build',
					'--platform',
					targetPlatform,
					'--mode',
					buildMode,
				],
				description: `cli build --platform ${targetPlatform} --mode ${buildMode}`,
			};
		} catch {
			// All strategies failed
		}

		throw Errors.buildToolNotFound(
			'uni-app build tool (tried npm scripts, uni CLI, Vue CLI, HBuilderX CLI)'
		);
	}

	private async executeBuild(
		strategy: { command: string; args: string[]; description: string },
		options: BuildOptions
	): Promise<void> {
		options.logger.debug?.(
			`[uni-app] Executing command: ${strategy.description}`
		);

		// Add optimization environment variables
		const optimizationEnv = this.getOptimizationEnv(options);

		const result = await execa(strategy.command, strategy.args, {
			cwd: options.cwd,
			stdio: options.logger.debug ? 'inherit' : 'pipe',
			env: {
				...process.env,
				...options.env,
				...optimizationEnv,
				NODE_ENV: options.mode || 'production',
			},
		});

		if (result.exitCode !== 0) {
			throw Errors.buildFailed('uni-app', {
				exitCode: result.exitCode,
				stderr: result.stderr,
			});
		}
	}

	async getOutputPath(options: BuildOptions): Promise<string> {
		try {
			// Priority 1: Check vue.config.js configuration
			const outputFromVueConfig = await this.getOutputFromVueConfig(
				options.cwd
			);
			if (outputFromVueConfig) {
				const candidate = path.resolve(
					options.cwd,
					outputFromVueConfig
				);
				options.logger.debug?.(
					`[uni-app] Output directory from vue.config.js: ${candidate}`
				);
				return candidate;
			}

			// Priority 2: Check package.json uni-app configuration
			const outputFromPackageJson = await this.getOutputFromPackageJson(
				options.cwd
			);
			if (outputFromPackageJson) {
				const candidate = path.resolve(
					options.cwd,
					outputFromPackageJson
				);
				options.logger.debug?.(
					`[uni-app] Output directory from package.json: ${candidate}`
				);
				return candidate;
			}

			// Priority 3: Check manifest.json for project configuration
			const outputFromManifest = await this.getOutputFromManifest(
				options.cwd
			);
			if (outputFromManifest) {
				const candidate = path.resolve(options.cwd, outputFromManifest);
				options.logger.debug?.(
					`[uni-app] Output directory from manifest: ${candidate}`
				);
				return candidate;
			}

			// Priority 4: Use conventional paths based on detected build strategy
			const targetPlatform = this.getTargetPlatform(options);
			const conventionalPath = this.getConventionalOutputPath(
				options.mode,
				targetPlatform
			);
			const candidate = path.resolve(options.cwd, conventionalPath);
			options.logger.debug?.(
				`[uni-app] Using conventional output directory: ${candidate}`
			);
			return candidate;
		} catch (error) {
			// Fallback to default path
			const defaultPath = 'dist/build/mp-weixin';
			const candidate = path.resolve(options.cwd, defaultPath);
			options.logger.debug?.(
				`[uni-app] Using fallback output directory: ${candidate}`
			);
			return candidate;
		}
	}

	private async getOutputFromVueConfig(cwd: string): Promise<string | null> {
		const vueConfigPath = path.resolve(cwd, 'vue.config.js');

		try {
			// Check if vue.config.js exists
			await fs.access(vueConfigPath);

			// Import the config (note: this might not work in all cases due to dynamic imports)
			try {
				const vueConfig = await import(vueConfigPath);
				const config = vueConfig?.default || vueConfig;

				// Check various possible configuration paths
				if (config?.pluginOptions?.['uni-app']?.outputDir) {
					return config.pluginOptions['uni-app'].outputDir;
				}

				if (config?.outputDir) {
					return config.outputDir;
				}

				// Check for function-based config
				if (typeof config === 'function') {
					const resolvedConfig = config();
					if (resolvedConfig?.pluginOptions?.['uni-app']?.outputDir) {
						return resolvedConfig.pluginOptions['uni-app']
							.outputDir;
					}
				}
			} catch {
				// If import fails, try reading as text and basic parsing
				const configContent = await fs.readFile(vueConfigPath, 'utf-8');
				const outputDirMatch = configContent.match(
					/outputDir:\s*['"`]([^'"`]+)['"`]/
				);
				if (outputDirMatch) {
					return outputDirMatch[1];
				}
			}
		} catch {
			// vue.config.js doesn't exist or can't be read
		}

		return null;
	}

	private async getOutputFromPackageJson(
		cwd: string
	): Promise<string | null> {
		const pkg = await readJsonSafe(path.resolve(cwd, 'package.json'));

		if (pkg?.uniApp?.outputDir) {
			return pkg.uniApp.outputDir;
		}

		// Check for build scripts that might indicate output directory
		if (pkg?.scripts) {
			const buildScript =
				pkg.scripts['build:mp-weixin'] || pkg.scripts['build:weapp'];
			if (buildScript && typeof buildScript === 'string') {
				// Try to extract output directory from build script
				const outputMatch = buildScript.match(/--output[=\s]+([^\s]+)/);
				if (outputMatch) {
					return outputMatch[1];
				}
			}
		}

		return null;
	}

	private async getOutputFromManifest(cwd: string): Promise<string | null> {
		try {
			const manifestPath = path.resolve(cwd, 'src/manifest.json');
			const manifestContent = await fs.readFile(manifestPath, 'utf-8');
			const manifest = JSON.parse(manifestContent);

			// Check for mp-weixin specific configuration
			if (manifest?.['mp-weixin']?.outputDir) {
				return manifest['mp-weixin'].outputDir;
			}

			// Check for global output configuration
			if (manifest?.outputDir) {
				return manifest.outputDir;
			}
		} catch {
			// manifest.json doesn't exist or can't be parsed
		}

		return null;
	}

	private getConventionalOutputPath(
		mode?: string,
		platform = 'mp-weixin'
	): string {
		// Common uni-app output paths based on build mode and tooling
		const basePaths = [
			`dist/build/${platform}`, // Vue CLI + uni-app plugin
			`dist/${platform}`, // uni CLI
			`unpackage/dist/build/${platform}`, // HBuilderX
			`build/${platform}`, // Custom build
		];

		// Adjust for development mode
		if (mode === 'development' || mode === 'dev') {
			return basePaths[0].replace('/build/', '/dev/');
		}

		// Return the most common production path
		return basePaths[0];
	}

	/**
	 * Get target platform from options or default to mp-weixin
	 */
	private getTargetPlatform(options?: BuildOptions): string {
		// You can extend this to read from config file or options
		// For now, default to mp-weixin (WeChat Mini Program)
		return 'mp-weixin';
	}

	/**
	 * Map build mode to uni-app specific mode with comprehensive environment support
	 */
	private getBuildMode(mode?: string): string {
		if (!mode) return 'production';

		const normalizedMode = mode.toLowerCase();

		// Development modes
		if (['development', 'dev', 'local'].includes(normalizedMode)) {
			return 'development';
		}

		// Testing modes
		if (
			['test', 'testing', 'qa', 'staging', 'pre', 'preprod'].includes(
				normalizedMode
			)
		) {
			return 'test';
		}

		// Production modes
		if (
			['production', 'prod', 'release', 'live'].includes(normalizedMode)
		) {
			return 'production';
		}

		// Custom modes - default to production for safety
		return 'production';
	}

	/**
	 * Get environment-specific configuration for uni-app build
	 */
	private getEnvironmentConfig(mode?: string): Record<string, any> {
		const buildMode = this.getBuildMode(mode);

		const baseConfig = {
			sourceMap: buildMode !== 'production',
			minimize: buildMode === 'production',
			extractCSS: buildMode === 'production',
		};

		switch (buildMode) {
			case 'development':
				return {
					...baseConfig,
					devtools: true,
					hot: true,
					watchOptions: {
						poll: false,
						ignored: /node_modules/,
					},
				};

			case 'test':
				return {
					...baseConfig,
					sourceMap: true,
					minimize: false,
					devtools: false,
				};

			case 'production':
			default:
				return {
					...baseConfig,
					sourceMap: false,
					minimize: true,
					devtools: false,
					optimization: {
						splitChunks: true,
						treeShaking: true,
					},
				};
		}
	}

	/**
	 * Validate uni-app project configuration
	 */
	private async validateProjectConfiguration(
		cwd: string,
		logger: any
	): Promise<void> {
		const errors: string[] = [];

		// Check package.json
		const pkg = await readJsonSafe(path.resolve(cwd, 'package.json'));
		if (!pkg) {
			errors.push('package.json not found');
		} else {
			// Check if any uni-app dependencies exist
			const deps = {
				...(pkg.dependencies || {}),
				...(pkg.devDependencies || {}),
			};
			const hasUniDeps = [
				'@dcloudio/uni-app',
				'@dcloudio/vue-cli-plugin-uni',
				'@dcloudio/vite-plugin-uni',
			].some((dep) => deps[dep]);

			if (!hasUniDeps) {
				errors.push(
					'No uni-app dependencies found. Install @dcloudio/uni-app or related packages.'
				);
			}
		}

		// Check for uni-app configuration files
		const manifestPath = path.resolve(cwd, 'src/manifest.json');
		const pagesPath = path.resolve(cwd, 'src/pages.json');

		try {
			await fs.access(manifestPath);
		} catch {
			errors.push(
				'src/manifest.json not found. This file is required for uni-app projects.'
			);
		}

		try {
			await fs.access(pagesPath);
		} catch {
			errors.push(
				'src/pages.json not found. This file is required for uni-app projects.'
			);
		}

		// Check for main.js or main.ts
		const mainFiles = ['src/main.js', 'src/main.ts'];
		let hasMainFile = false;
		for (const mainFile of mainFiles) {
			try {
				await fs.access(path.resolve(cwd, mainFile));
				hasMainFile = true;
				break;
			} catch {
				// Continue checking
			}
		}

		if (!hasMainFile) {
			errors.push(
				'No main entry file found. Expected src/main.js or src/main.ts'
			);
		}

		// Log warnings for non-critical issues
		if (errors.length > 0) {
			logger.warn?.(
				`[uni-app] Configuration validation found ${errors.length} issue(s):`
			);
			errors.forEach((error) => {
				logger.warn?.(`  • ${error}`);
			});

			// Only throw error for critical issues
			const criticalErrors = errors.filter(
				(error) =>
					error.includes('package.json') ||
					error.includes('manifest.json') ||
					error.includes('pages.json')
			);

			if (criticalErrors.length > 0) {
				throw Errors.configInvalid(
					`uni-app project validation failed: ${criticalErrors.join(
						'; '
					)}`
				);
			}
		} else {
			logger.debug?.('[uni-app] Project configuration validation passed');
		}
	}

	/**
	 * Get optimization environment variables for uni-app build
	 */
	private getOptimizationEnv(options: BuildOptions): Record<string, string> {
		const env: Record<string, string> = {};

		// Enable conditional compilation
		env.UNI_PLATFORM = this.getTargetPlatform(options);

		// Set optimization level based on mode
		const buildMode = this.getBuildMode(options.mode);
		if (buildMode === 'production') {
			// Production optimizations
			env.UNI_MINIMIZE = 'true';
			env.UNI_SOURCEMAP = 'false';
			env.UNI_OUTPUT_DIR = this.getConventionalOutputPath(options.mode);
		} else {
			// Development optimizations
			env.UNI_MINIMIZE = 'false';
			env.UNI_SOURCEMAP = 'true';
			env.UNI_OUTPUT_DIR = this.getConventionalOutputPath(options.mode);
		}

		// Enable/disable features based on environment
		if (buildMode === 'development') {
			env.UNI_DEVTOOLS = 'true';
			env.UNI_DEBUG = 'true';
		}

		// Custom conditional compilation
		if (options.env?.UNI_CUSTOM_DEFINE) {
			env.UNI_CUSTOM_DEFINE = options.env.UNI_CUSTOM_DEFINE;
		}

		return env;
	}

	/**
	 * Classify and enhance build errors with uni-app specific troubleshooting
	 */
	private classifyBuildError(error: unknown): Error {
		if (!(error instanceof Error)) {
			return Errors.buildFailed('uni-app', {
				originalError: String(error),
			});
		}

		const errorMessage = error.message.toLowerCase();

		// Command not found errors
		if (
			errorMessage.includes('command not found') ||
			errorMessage.includes('not recognized')
		) {
			if (errorMessage.includes('uni')) {
				return Errors.buildToolNotFound('uni CLI');
			} else if (errorMessage.includes('vue-cli-service')) {
				return Errors.buildToolNotFound('Vue CLI');
			} else {
				return Errors.buildToolNotFound('uni-app build tool');
			}
		}

		// Dependency errors
		if (
			errorMessage.includes('dependencies') ||
			errorMessage.includes('node_modules')
		) {
			return Errors.buildFailed('uni-app', {
				originalError: error.message,
				suggestion: 'Install dependencies: npm install or yarn install',
			});
		}

		// Configuration errors
		if (
			errorMessage.includes('vue.config') ||
			errorMessage.includes('config')
		) {
			return Errors.buildFailed('uni-app', {
				originalError: error.message,
				suggestion:
					'Check vue.config.js configuration and uni-app plugin settings',
			});
		}

		// Platform-specific errors
		if (errorMessage.includes('platform')) {
			return Errors.buildFailed('uni-app', {
				originalError: error.message,
				suggestion:
					'Verify target platform is supported. Use: mp-weixin, mp-alipay, mp-baidu, etc.',
			});
		}

		// Compilation errors
		if (errorMessage.includes('syntax') || errorMessage.includes('parse')) {
			return Errors.buildFailed('uni-app', {
				originalError: error.message,
				suggestion:
					'Fix syntax errors in your code. Check pages.json and manifest.json format',
			});
		}

		// Manifest/Pages errors
		if (
			errorMessage.includes('manifest') ||
			errorMessage.includes('pages.json')
		) {
			return Errors.buildFailed('uni-app', {
				originalError: error.message,
				suggestion:
					'Verify src/manifest.json and src/pages.json files exist and have valid JSON format',
			});
		}

		// Memory/Performance errors
		if (
			errorMessage.includes('heap out of memory') ||
			errorMessage.includes('javascript heap')
		) {
			return Errors.buildFailed('uni-app', {
				originalError: error.message,
				suggestion:
					'Increase Node.js memory: node --max-old-space-size=4096',
			});
		}

		// Permission errors
		if (
			errorMessage.includes('eacces') ||
			errorMessage.includes('permission denied')
		) {
			return Errors.buildFailed('uni-app', {
				originalError: error.message,
				suggestion:
					'Fix file permissions or run with appropriate privileges',
			});
		}

		// Network errors
		if (
			errorMessage.includes('network') ||
			errorMessage.includes('timeout') ||
			errorMessage.includes('fetch')
		) {
			return Errors.buildFailed('uni-app', {
				originalError: error.message,
				suggestion:
					'Check network connection and npm registry settings',
			});
		}

		// Generic build failure with context
		return Errors.buildFailed('uni-app', {
			originalError: error.message,
			suggestion:
				'Check build logs above. Ensure uni-app project setup is correct and all dependencies are installed',
		});
	}
}

export function createUniAppAdapter(): FrameworkAdapter {
	return new UniAppFrameworkAdapter();
}
