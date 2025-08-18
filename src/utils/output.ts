import type { Logger } from '../types';
import type { PreviewResult, UploadResult } from '../types/adapters';

export interface StructuredOutput<T = unknown> {
	success: boolean;
	timestamp: string;
	operation: 'preview' | 'deploy';
	data?: T;
	error?: {
		code: number;
		message: string;
		details?: Record<string, unknown>;
	};
	metadata?: {
		framework?: string;
		platform?: string;
		version?: string;
		description?: string;
		projectPath?: string;
		outputPath?: string;
	};
}

export interface OutputOptions {
	json?: boolean;
	verbose?: boolean;
	operation: 'preview' | 'deploy';
	metadata?: StructuredOutput['metadata'];
}

export class OutputFormatter {
	private logger: Logger;

	constructor(logger: Logger) {
		this.logger = logger;
	}

	/**
	 * Format successful operation result
	 */
	formatSuccess<T>(result: T, options: OutputOptions): StructuredOutput<T> {
		const output: StructuredOutput<T> = {
			success: true,
			timestamp: new Date().toISOString(),
			operation: options.operation,
			data: result,
			metadata: options.metadata,
		};

		if (options.json) {
			console.log(JSON.stringify(output, null, 2));
		} else {
			this.formatHumanReadableSuccess(result, options);
		}

		return output;
	}

	/**
	 * Format error result
	 */
	formatError(error: unknown, options: OutputOptions): StructuredOutput {
		const output: StructuredOutput = {
			success: false,
			timestamp: new Date().toISOString(),
			operation: options.operation,
			metadata: options.metadata,
		};

		if (error instanceof Error) {
			output.error = {
				code: (error as any).code || 1,
				message: error.message,
				details: (error as any).details,
			};
		} else {
			output.error = {
				code: 1,
				message: String(error),
			};
		}

		if (options.json) {
			console.log(JSON.stringify(output, null, 2));
		} else {
			this.formatHumanReadableError(error, options);
		}

		return output;
	}

	private formatHumanReadableSuccess(
		result: unknown,
		options: OutputOptions
	): void {
		const { operation, metadata } = options;

		// Operation header
		const operationName = operation === 'preview' ? '预览' : '部署';
		this.logger.info(`\n🎉 ${operationName}成功完成！`);

		// Metadata information
		if (metadata) {
			if (metadata.framework) {
				this.logger.info(`📦 框架: ${metadata.framework}`);
			}
			if (metadata.platform) {
				this.logger.info(`🎯 平台: ${metadata.platform}`);
			}
			if (metadata.version) {
				this.logger.info(`🏷️  版本: ${metadata.version}`);
			}
			if (metadata.description) {
				this.logger.info(`📝 描述: ${metadata.description}`);
			}
		}

		// Operation-specific details
		if (operation === 'preview' && this.isPreviewResult(result)) {
			if (result.qrcodeImagePath) {
				this.logger.info(`📱 二维码已保存: ${result.qrcodeImagePath}`);
			}
		} else if (operation === 'deploy' && this.isUploadResult(result)) {
			if (result.version) {
				this.logger.info(`✅ 上传版本: ${result.version}`);
			}
		}

		// Verbose details
		if (options.verbose && result && typeof result === 'object') {
			this.logger.debug?.('\n📋 详细信息:', result);
		}
	}

	private formatHumanReadableError(
		error: unknown,
		options: OutputOptions
	): void {
		const { operation, metadata } = options;

		const operationName = operation === 'preview' ? '预览' : '部署';
		this.logger.error(`\n❌ ${operationName}失败`);

		if (error instanceof Error) {
			this.logger.error(`💥 错误: ${error.message}`);

			// Show error details if available
			const details = (error as any).details;
			if (details && options.verbose) {
				this.logger.error('📋 错误详情:', details);
			}

			// Show error code if available
			const code = (error as any).code;
			if (code) {
				this.logger.error(`🔢 错误代码: ${code}`);
			}
		}

		// Show context information
		if (metadata) {
			this.logger.error('\n📍 上下文信息:');
			if (metadata.framework)
				this.logger.error(`  框架: ${metadata.framework}`);
			if (metadata.platform)
				this.logger.error(`  平台: ${metadata.platform}`);
			if (metadata.projectPath)
				this.logger.error(`  项目路径: ${metadata.projectPath}`);
			if (metadata.outputPath)
				this.logger.error(`  输出路径: ${metadata.outputPath}`);
		}

		// Provide helpful suggestions based on error type
		this.provideSuggestions(error);
	}

	private provideSuggestions(error: unknown): void {
		if (!(error instanceof Error)) return;

		const message = error.message.toLowerCase();
		const code = (error as any).code;

		this.logger.error('\n💡 建议解决方案:');

		if (message.includes('appid') || code === 101) {
			this.logger.error('  • 检查 appId 配置是否正确');
			this.logger.error('  • 确认小程序已在微信公众平台注册');
		} else if (
			message.includes('private') ||
			message.includes('key') ||
			code === 102
		) {
			this.logger.error('  • 检查私钥文件路径是否正确');
			this.logger.error('  • 确认私钥文件权限可读');
			this.logger.error('  • 验证私钥是否对应正确的小程序');
		} else if (
			message.includes('build') ||
			message.includes('构建') ||
			code === 60
		) {
			this.logger.error('  • 检查项目依赖是否已正确安装');
			this.logger.error('  • 确认构建工具（Taro/uni-app CLI）已安装');
			this.logger.error('  • 查看详细构建日志定位问题');
		} else if (message.includes('network') || message.includes('timeout')) {
			this.logger.error('  • 检查网络连接是否正常');
			this.logger.error('  • 稍后重试或使用代理');
		} else {
			this.logger.error('  • 使用 --verbose 参数获取详细日志');
			this.logger.error('  • 检查项目配置文件');
			this.logger.error('  • 查看官方文档或提交问题反馈');
		}
	}

	private isPreviewResult(result: unknown): result is PreviewResult {
		return (
			typeof result === 'object' && result !== null && 'success' in result
		);
	}

	private isUploadResult(result: unknown): result is UploadResult {
		return (
			typeof result === 'object' && result !== null && 'success' in result
		);
	}
}

export function createOutputFormatter(logger: Logger): OutputFormatter {
	return new OutputFormatter(logger);
}
