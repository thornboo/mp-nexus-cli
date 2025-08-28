import path from 'node:path';
import type { NexusConfig } from '../types';

/**
 * Load user configuration from file
 */
export async function loadUserConfig(
	configPath?: string
): Promise<Partial<NexusConfig>> {
	const resolved =
		configPath ?? path.resolve(process.cwd(), 'mp-nexus.config.js');
	try {
		// eslint-disable-next-line @typescript-eslint/no-var-requires
		const cfg = require(resolved);
		return cfg && cfg.default ? cfg.default : cfg;
	} catch {
		return {};
	}
}
