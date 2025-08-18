import { simpleGit } from 'simple-git';
import path from 'node:path';
import fs from 'node:fs/promises';
import type { Logger } from '../types';

export interface GitInfo {
	latestCommitMessage?: string;
	packageVersion?: string;
}

export async function getGitInfo(
	cwd: string,
	logger: Logger
): Promise<GitInfo> {
	const result: GitInfo = {};

	try {
		// Get latest commit message
		const git = simpleGit(cwd);
		const isRepo = await git.checkIsRepo();

		if (isRepo) {
			const log = await git.log({ maxCount: 1 });
			if (log.latest) {
				result.latestCommitMessage = log.latest.message;
				logger.debug?.(
					`[git] Latest commit message: ${result.latestCommitMessage}`
				);
			}
		} else {
			logger.debug?.('[git] Not a git repository');
		}
	} catch (error) {
		logger.debug?.('[git] Failed to get commit message', {
			error: error instanceof Error ? error.message : String(error),
		});
	}

	try {
		// Get package.json version
		const packagePath = path.resolve(cwd, 'package.json');
		const packageContent = await fs.readFile(packagePath, 'utf-8');
		const packageJson = JSON.parse(packageContent);

		if (packageJson.version) {
			result.packageVersion = packageJson.version;
			logger.debug?.(`[git] Package version: ${result.packageVersion}`);
		}
	} catch (error) {
		logger.debug?.('[git] Failed to read package.json version', {
			error: error instanceof Error ? error.message : String(error),
		});
	}

	return result;
}

export function applyGitDefaults(
	options: { desc?: string; ver?: string },
	gitInfo: GitInfo
): { desc?: string; ver?: string } {
	return {
		desc: options.desc || gitInfo.latestCommitMessage,
		ver: options.ver || gitInfo.packageVersion,
	};
}
