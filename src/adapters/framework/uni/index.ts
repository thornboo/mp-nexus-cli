import path from 'node:path';
import fs from 'node:fs/promises';
import { execa } from 'execa';
import type { BuildOptions, FrameworkAdapter } from '../../../types/adapters';
import { Errors } from '../../../utils/errors';
import { withRetry, RetryPresets } from '../../../utils/retry';

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
			options.logger.info('[uni-app] Skip build (NEXUS_SKIP_BUILD=1)');
			return;
		}

		options.logger.info('[uni-app] Starting build...');

		try {
			// Detect build command strategy
			const pkg = await readJsonSafe(
				path.resolve(options.cwd, 'package.json')
			);

			const buildStrategy = await this.detectBuildStrategy(options.cwd, pkg);
			
			// Execute build with retry mechanism
			await withRetry(
				async () => {
					await this.executeBuild(buildStrategy, options);
				},
				{ ...RetryPresets.build, logger: options.logger },
				'uni-app build'
			);

			options.logger.info('[uni-app] Build completed successfully');
		} catch (error) {
			if (error instanceof Error) {
				// Re-throw as properly classified error
				if (
					error.message.includes('command not found') ||
					error.message.includes('not recognized')
				) {
					throw Errors.buildToolNotFound('uni-app CLI');
				} else if (error.message.includes('dependencies')) {
					throw Errors.buildFailed('uni-app', {
						originalError: error.message,
						suggestion: 'Run `npm install` to install dependencies',
					});
				} else if (error.message.includes('vue.config')) {
					throw Errors.buildFailed('uni-app', {
						originalError: error.message,
						suggestion: 'Check vue.config.js configuration',
					});
				}
			}

			throw error;
		}
	}

	private async detectBuildStrategy(cwd: string, pkg: any): Promise<{
		command: string;
		args: string[];
		description: string;
	}> {
		// Strategy 1: Check for npm scripts
		const commonScripts = [
			'build:mp-weixin',
			'build:weapp', 
			'build:mp',
			'uni:build:mp-weixin'
		];

		for (const script of commonScripts) {
			if (pkg?.scripts?.[script]) {
				return {
					command: 'npm',
					args: ['run', script],
					description: `npm run ${script}`
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
				args: ['build', '--platform', 'mp-weixin'],
				description: 'uni build --platform mp-weixin'
			};
		} catch {
			// Continue to next strategy
		}

		// Strategy 3: Try Vue CLI with uni plugin
		try {
			await withRetry(
				async () => {
					const result = await execa('vue-cli-service', ['--version'], { cwd });
					if (result.exitCode !== 0) {
						throw Errors.buildToolNotFound('Vue CLI');
					}
				},
				{ ...RetryPresets.quick },
				'Vue CLI detection'
			);

			return {
				command: 'vue-cli-service',
				args: ['uni-build', '--mode', 'production', '--platform', 'mp-weixin'],
				description: 'vue-cli-service uni-build --platform mp-weixin'
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
				args: ['build', '--platform', 'mp-weixin'],
				description: 'cli build --platform mp-weixin'
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

		const result = await execa(strategy.command, strategy.args, {
			cwd: options.cwd,
			stdio: options.logger.debug ? 'inherit' : 'pipe',
			env: {
				...process.env,
				...options.env,
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
			const outputFromVueConfig = await this.getOutputFromVueConfig(options.cwd);
			if (outputFromVueConfig) {
				const candidate = path.resolve(options.cwd, outputFromVueConfig);
				options.logger.debug?.(`[uni-app] Output directory from vue.config.js: ${candidate}`);
				return candidate;
			}

			// Priority 2: Check package.json uni-app configuration
			const outputFromPackageJson = await this.getOutputFromPackageJson(options.cwd);
			if (outputFromPackageJson) {
				const candidate = path.resolve(options.cwd, outputFromPackageJson);
				options.logger.debug?.(`[uni-app] Output directory from package.json: ${candidate}`);
				return candidate;
			}

			// Priority 3: Check manifest.json for project configuration
			const outputFromManifest = await this.getOutputFromManifest(options.cwd);
			if (outputFromManifest) {
				const candidate = path.resolve(options.cwd, outputFromManifest);
				options.logger.debug?.(`[uni-app] Output directory from manifest: ${candidate}`);
				return candidate;
			}

			// Priority 4: Use conventional paths based on detected build strategy
			const conventionalPath = this.getConventionalOutputPath(options.mode);
			const candidate = path.resolve(options.cwd, conventionalPath);
			options.logger.debug?.(`[uni-app] Using conventional output directory: ${candidate}`);
			return candidate;

		} catch (error) {
			// Fallback to default path
			const defaultPath = 'dist/build/mp-weixin';
			const candidate = path.resolve(options.cwd, defaultPath);
			options.logger.debug?.(`[uni-app] Using fallback output directory: ${candidate}`);
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
						return resolvedConfig.pluginOptions['uni-app'].outputDir;
					}
				}
			} catch {
				// If import fails, try reading as text and basic parsing
				const configContent = await fs.readFile(vueConfigPath, 'utf-8');
				const outputDirMatch = configContent.match(/outputDir:\s*['"`]([^'"`]+)['"`]/);
				if (outputDirMatch) {
					return outputDirMatch[1];
				}
			}
		} catch {
			// vue.config.js doesn't exist or can't be read
		}
		
		return null;
	}

	private async getOutputFromPackageJson(cwd: string): Promise<string | null> {
		const pkg = await readJsonSafe(path.resolve(cwd, 'package.json'));
		
		if (pkg?.uniApp?.outputDir) {
			return pkg.uniApp.outputDir;
		}
		
		// Check for build scripts that might indicate output directory
		if (pkg?.scripts) {
			const buildScript = pkg.scripts['build:mp-weixin'] || pkg.scripts['build:weapp'];
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

	private getConventionalOutputPath(mode?: string): string {
		// Common uni-app output paths based on build mode and tooling
		const basePaths = [
			'dist/build/mp-weixin',    // Vue CLI + uni-app plugin
			'dist/mp-weixin',          // uni CLI
			'unpackage/dist/build/mp-weixin', // HBuilderX
			'build/mp-weixin'          // Custom build
		];
		
		// Adjust for development mode
		if (mode === 'development' || mode === 'dev') {
			return basePaths[0].replace('/build/', '/dev/');
		}
		
		// Return the most common production path
		return basePaths[0];
	}
}

export function createUniAppAdapter(): FrameworkAdapter {
	return new UniAppFrameworkAdapter();
}
