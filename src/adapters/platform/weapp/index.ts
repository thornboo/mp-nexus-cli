import path from 'node:path';
import fs from 'node:fs/promises';
import * as ci from 'miniprogram-ci';
import type {
	PlatformAdapter,
	PreviewOptions,
	PreviewResult,
	UploadOptions,
	UploadResult,
} from '../../../types/adapters';
import { Errors } from '../../../utils/errors';
import { withRetry, RetryPresets } from '../../../utils/retry';

export class WeappPlatformAdapter implements PlatformAdapter {
	name = 'weapp';

	private async ensurePrivateKey(privateKeyPath: string): Promise<void> {
		try {
			await fs.access(privateKeyPath);
		} catch {
			throw Errors.invalidPrivateKey(privateKeyPath);
		}
	}

	async preview(options: PreviewOptions): Promise<PreviewResult> {
		await this.ensurePrivateKey(options.privateKeyPath);

		const project = new ci.Project({
			appid: options.appId,
			type: 'miniProgram',
			projectPath: options.projectPath,
			privateKeyPath: options.privateKeyPath,
			ignores: ['node_modules/**/*'],
		});

		try {
			options.logger.info(
				'[weapp] Starting preview QR code generation...'
			);

			const result = await withRetry(
				async () => {
					// First generate terminal QR code for immediate display
					console.log('\n📱 Preview QR Code:\n');
					const terminalResult = await ci.preview({
						project,
						version: options.version || '1.0.0',
						desc: options.desc || 'Preview version',
						qrcodeFormat: 'terminal',
						robot: 1,
						setting: {
							es6: true,
							minify: true,
							codeProtect: true,
							...(options.ciOptions?.setting || {}),
						},
						...options.ciOptions,
					});

					// Also generate image file for saving
					const imagePath =
						options.qrcodeOutputPath ||
						path.resolve(options.projectPath, 'preview-qrcode.png');
					const imageResult = await ci.preview({
						project,
						version: options.version || '1.0.0',
						desc: options.desc || 'Preview version',
						qrcodeFormat: 'image',
						qrcodeOutputDest: imagePath,
						robot: 1,
						setting: {
							es6: true,
							minify: true,
							codeProtect: true,
							...(options.ciOptions?.setting || {}),
						},
						...options.ciOptions,
					});

					return {
						terminal: terminalResult,
						image: imageResult,
						imagePath,
					};
				},
				{ ...RetryPresets.network, logger: options.logger },
				'WeApp preview generation'
			);

			options.logger.info(
				'[weapp] Preview QR code generated successfully'
			);
			console.log(`\nQR code saved to: ${result.imagePath}\n`);

			return {
				success: true,
				qrcodeImagePath: result.imagePath,
				raw: { terminal: result.terminal, image: result.image },
			};
		} catch (error) {
			const classified = this.classifyWeAppError(error);
			throw classified;
		}
	}

	private classifyWeAppError(error: unknown): Error {
		if (!(error instanceof Error)) {
			return Errors.ciOperationFailed('unknown', {
				originalError: String(error),
			});
		}

		const message = error.message.toLowerCase();

		if (message.includes('appid') || message.includes('invalid app')) {
			return Errors.invalidAppId('provided appId');
		}

		if (
			message.includes('private') ||
			message.includes('key') ||
			message.includes('signature')
		) {
			return Errors.invalidPrivateKey('provided private key');
		}

		if (
			message.includes('network') ||
			message.includes('timeout') ||
			message.includes('connect')
		) {
			return Errors.networkError('miniprogram-ci operation', {
				originalError: error.message,
			});
		}

		if (message.includes('version') && message.includes('exist')) {
			return Errors.deployVersionExists('current version');
		}

		if (message.includes('auth') || message.includes('permission')) {
			return Errors.apiAuthError('WeChat platform');
		}

		return Errors.ciOperationFailed('miniprogram-ci', {
			originalError: error.message,
		});
	}

	async upload(options: UploadOptions): Promise<UploadResult> {
		await this.ensurePrivateKey(options.privateKeyPath);

		const project = new ci.Project({
			appid: options.appId,
			type: 'miniProgram',
			projectPath: options.projectPath,
			privateKeyPath: options.privateKeyPath,
			ignores: ['node_modules/**/*'],
		});

		try {
			options.logger.info('[weapp] Starting code upload...');

			const uploadResult = await withRetry(
				async () => {
					return await ci.upload({
						project,
						version: options.version || '1.0.0',
						desc: options.desc || 'Upload version',
						robot: 1,
						setting: {
							es6: true,
							minify: true,
							codeProtect: true,
							...(options.ciOptions?.setting || {}),
						},
						...options.ciOptions,
					});
				},
				{ ...RetryPresets.network, logger: options.logger },
				'WeApp code upload'
			);

			options.logger.info('[weapp] Upload completed successfully', {
				subPackageInfo: uploadResult.subPackageInfo,
				pluginInfo: uploadResult.pluginInfo,
			});

			return {
				success: true,
				version: options.version || '1.0.0',
				raw: uploadResult,
			};
		} catch (error) {
			const classified = this.classifyWeAppError(error);
			throw classified;
		}
	}
}

export function createWeappAdapter(): PlatformAdapter {
	return new WeappPlatformAdapter();
}
