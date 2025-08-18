import { ExitCodes, type ExitCode } from './exit-codes';

export class NexusError extends Error {
	public readonly code: ExitCode;
	public readonly details?: Record<string, unknown>;

	constructor(
		message: string,
		code: ExitCode,
		details?: Record<string, unknown>
	) {
		super(message);
		this.name = 'NexusError';
		this.code = code;
		this.details = details;
	}
}

export function createError(
	message: string,
	code: ExitCode,
	details?: Record<string, unknown>
): NexusError {
	return new NexusError(message, code, details);
}

export function handleError(
	error: unknown,
	logger?: { error: (msg: string, ...args: unknown[]) => void }
): ExitCode {
	if (error instanceof NexusError) {
		logger?.error(`[Error] ${error.message}`, error.details || {});
		return error.code;
	}

	if (error instanceof Error) {
		// Classify common Node.js errors
		const classified = classifySystemError(error);
		logger?.error(`[Error] ${classified.message}`, classified.details);
		return classified.code;
	}

	logger?.error(`[Error] ${String(error)}`);
	return ExitCodes.ERROR_UNKNOWN;
}

export function classifySystemError(error: Error): {
	message: string;
	code: ExitCode;
	details: Record<string, unknown>;
} {
	const message = error.message.toLowerCase();

	// Network errors
	if (
		message.includes('enotfound') ||
		message.includes('econnrefused') ||
		message.includes('timeout')
	) {
		return {
			message: `Network connectivity issue: ${error.message}`,
			code: ExitCodes.ERROR_NETWORK,
			details: {
				originalError: error.message,
				suggestion: 'Check internet connection and proxy settings',
			},
		};
	}

	// File system errors
	if (message.includes('enoent') || message.includes('no such file')) {
		return {
			message: `File or directory not found: ${error.message}`,
			code: ExitCodes.ERROR_FILE_NOT_FOUND,
			details: {
				originalError: error.message,
				suggestion: 'Verify the file path exists',
			},
		};
	}

	if (message.includes('eacces') || message.includes('permission denied')) {
		return {
			message: `Permission denied: ${error.message}`,
			code: ExitCodes.ERROR_FILE_PERMISSION,
			details: {
				originalError: error.message,
				suggestion:
					'Check file permissions or run with appropriate privileges',
			},
		};
	}

	// Build tool errors
	if (
		message.includes('command not found') ||
		message.includes('is not recognized')
	) {
		return {
			message: `Command not found: ${error.message}`,
			code: ExitCodes.ERROR_BUILD_TOOL_NOT_FOUND,
			details: {
				originalError: error.message,
				suggestion: 'Install the required CLI tool',
			},
		};
	}

	// Default classification
	return {
		message: error.message,
		code: ExitCodes.ERROR_UNKNOWN,
		details: { originalError: error.message },
	};
}

// 预定义错误工厂
export const Errors = {
	configNotFound: (path: string) =>
		createError(
			`Configuration file not found: ${path}`,
			ExitCodes.ERROR_CONFIG_NOT_FOUND,
			{
				path,
				suggestion: 'Run `nexus init` to create a configuration file',
			}
		),

	configInvalid: (field: string, value?: unknown) =>
		createError(
			`Invalid configuration field '${field}': ${value}`,
			ExitCodes.ERROR_CONFIG_INVALID,
			{
				field,
				value,
				suggestion:
					'Check configuration file syntax and required fields',
			}
		),

	fileNotFound: (path: string) =>
		createError(`File not found: ${path}`, ExitCodes.ERROR_FILE_NOT_FOUND, {
			path,
			suggestion: 'Verify the file path exists and is accessible',
		}),

	buildFailed: (framework: string, details?: unknown) =>
		createError(`${framework} build failed`, ExitCodes.ERROR_BUILD_FAILED, {
			framework,
			details,
			suggestion: 'Check build dependencies and project configuration',
		}),

	buildToolNotFound: (tool: string) =>
		createError(
			`Build tool not found: ${tool}`,
			ExitCodes.ERROR_BUILD_TOOL_NOT_FOUND,
			{ tool, suggestion: `Install ${tool} CLI globally or locally` }
		),

	buildTimeout: (framework: string, timeout: number) =>
		createError(
			`${framework} build timeout after ${timeout}ms`,
			ExitCodes.ERROR_BUILD_TIMEOUT,
			{
				framework,
				timeout,
				suggestion:
					'Check for build performance issues or increase timeout',
			}
		),

	deployFailed: (platform: string, details?: unknown) =>
		createError(
			`${platform} deployment failed`,
			ExitCodes.ERROR_DEPLOY_FAILED,
			{
				platform,
				details,
				suggestion:
					'Check platform credentials and network connectivity',
			}
		),

	deployVersionExists: (version: string) =>
		createError(
			`Version already exists: ${version}`,
			ExitCodes.ERROR_DEPLOY_VERSION_EXISTS,
			{
				version,
				suggestion:
					'Use a different version number or increment the version',
			}
		),

	networkError: (operation: string, details?: unknown) =>
		createError(
			`Network error during ${operation}`,
			ExitCodes.ERROR_NETWORK,
			{
				operation,
				details,
				suggestion: 'Check internet connection and try again',
			}
		),

	apiAuthError: (platform: string) =>
		createError(
			`API authentication failed for ${platform}`,
			ExitCodes.ERROR_API_AUTHENTICATION,
			{ platform, suggestion: 'Verify API credentials and permissions' }
		),

	invalidAppId: (appId: string) =>
		createError(
			`Invalid AppID: ${appId}`,
			ExitCodes.ERROR_WEAPP_INVALID_APPID,
			{
				appId,
				suggestion:
					'Check AppID format and ensure it exists in WeChat platform',
			}
		),

	invalidPrivateKey: (path: string) =>
		createError(
			`Invalid private key file: ${path}`,
			ExitCodes.ERROR_WEAPP_INVALID_PRIVATE_KEY,
			{
				path,
				suggestion:
					'Verify private key file exists and has correct permissions',
			}
		),

	ciOperationFailed: (operation: string, details?: unknown) =>
		createError(
			`CI operation '${operation}' failed`,
			ExitCodes.ERROR_WEAPP_CI_FAILED,
			{
				operation,
				details,
				suggestion: 'Check miniprogram-ci configuration and logs',
			}
		),
};
