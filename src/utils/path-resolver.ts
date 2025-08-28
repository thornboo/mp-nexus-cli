import path from 'node:path';
import fs from 'node:fs/promises';
import type { NexusConfig } from '../types';
import { Errors } from './errors';

/**
 * Resolve and validate project paths
 */
export async function ensurePaths(cfg: NexusConfig): Promise<{
	projectRoot: string;
	outputPath: string;
}> {
	const projectRoot = path.resolve(process.cwd(), cfg.projectPath || '.');
	const outputPath = path.resolve(projectRoot, cfg.outputDir || 'dist/weapp');
	
	// Best-effort check
	try {
		await fs.access(projectRoot);
	} catch {
		throw Errors.fileNotFound(projectRoot);
	}
	
	return { projectRoot, outputPath };
}
