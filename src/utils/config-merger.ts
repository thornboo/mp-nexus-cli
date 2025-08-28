import type { NexusConfig, CLIOptions, Logger } from '../types';

export interface RunContext extends CLIOptions {
	logger: Logger;
}

/**
 * Merge CLI options, environment variables, and file configuration
 */
export function mergeConfig(
	cli: RunContext,
	fileCfg: Partial<NexusConfig>
): NexusConfig {
	const merged: NexusConfig = {
		projectPath: fileCfg.projectPath ?? '.',
		platform: fileCfg.platform ?? 'weapp',
		appId: process.env.MP_APP_ID ?? fileCfg.appId ?? '',
		privateKeyPath:
			process.env.MP_PRIVATE_KEY_PATH ??
			fileCfg.privateKeyPath ??
			'private.key',
		outputDir: fileCfg.outputDir ?? 'dist/weapp',
		ciOptions: fileCfg.ciOptions ?? {},
		projectType: fileCfg.projectType,
		language: fileCfg.language,
		notify: fileCfg.notify,
	};

	if (cli.ver)
		merged.ciOptions = {
			...(merged.ciOptions || {}),
			version: cli.ver,
		} as any;
	if (cli.desc)
		merged.ciOptions = {
			...(merged.ciOptions || {}),
			desc: cli.desc,
		} as any;
	return merged;
}
