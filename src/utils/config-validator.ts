import type { NexusConfig } from '../types';
import { Errors } from './errors';

/**
 * Validate that required configuration fields are present
 */
export function assertMinimalConfig(cfg: NexusConfig): void {
	if (!cfg.appId) {
		throw Errors.invalidAppId('Not provided');
	}
	if (!cfg.privateKeyPath) {
		throw Errors.invalidPrivateKey('Not provided');
	}
}
