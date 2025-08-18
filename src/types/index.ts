/**
 * Type definitions for mp-nexus-cli
 * Root exports and common/shared types.
 */

export {
	type PlatformName,
	type BuildOptions,
	type FrameworkAdapter,
	type BaseCIOptions,
	type PreviewOptions,
	type UploadOptions,
	type PreviewResult,
	type UploadResult,
	type PlatformAdapter,
} from './adapters';
export {
	type NotifierProvider,
	type NotifierMessage,
	type NotifierConfig,
	type Notifier,
} from './notifier';

/** Logger interface used across the CLI for structured logging. */
export interface Logger {
	info(message: string, ...meta: unknown[]): void;
	warn(message: string, ...meta: unknown[]): void;
	error(message: string | Error, ...meta: unknown[]): void;
	debug?(message: string, ...meta: unknown[]): void;
	child?(bindings: Record<string, unknown>): Logger;
}

/** CLI options supported by commands like `preview` and `deploy`. */
export interface CLIOptions {
	mode?: string;
	desc?: string;
	ver?: string;
	config?: string;
	dryRun?: boolean;
	verbose?: boolean;
	json?: boolean;
}

/** Root configuration model loaded from `mp-nexus.config.js`. */
export interface NexusConfig {
	projectType?: 'taro' | 'uni-app';
	platform?: import('./adapters').PlatformName;
	appId: string;
	privateKeyPath: string;
	projectPath?: string;
	outputDir?: string;
	ciOptions?: Record<string, unknown>;
	notify?: {
		webhook?: string;
		provider?: import('./notifier').NotifierProvider;
		headers?: Record<string, string>;
	};
}
