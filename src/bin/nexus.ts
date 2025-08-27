import { Command } from 'commander';
import path from 'node:path';
import fs from 'node:fs';
import dotenv from 'dotenv';
import { runPreview, runDeploy } from '../core/orchestrator';
import { runInit } from '../commands/init';
import { ExitCodes } from '../utils/exit-codes';
import { handleError } from '../utils/errors';
import { createLogger } from '../utils/logger';
import {
	initI18n,
	setLanguage,
	getCurrentLanguage,
	isLanguageSupported,
	translate,
	type Language,
} from '../utils/i18n';

// Initialize i18n system
initI18n();

// Parse language option early to apply to all help texts
const langArgIndex = process.argv.findIndex((arg) => arg === '--lang');
if (langArgIndex !== -1 && process.argv[langArgIndex + 1]) {
	const langValue = process.argv[langArgIndex + 1];
	if (isLanguageSupported(langValue)) {
		setLanguage(langValue as Language);
	}
}

const program = new Command();

program
	.name('nexus')
	.description(translate('cli.description'))
	.version('0.0.0-mvp')
	.option(
		'--lang <language>',
		'Set interface language (en|zh-CN)',
		(value) => {
			if (isLanguageSupported(value)) {
				setLanguage(value as Language);
				return value;
			}
			console.error(
				`Unsupported language: ${value}. Supported: en, zh-CN`
			);
			process.exit(ExitCodes.ERROR_INVALID_ARGUMENTS);
		}
	);

function loadEnv(mode?: string) {
	dotenv.config();
	if (mode) {
		const envFile = `.env.${mode}`;
		if (fs.existsSync(envFile)) {
			dotenv.config({ path: envFile });
			process.env.NODE_ENV = mode;
		}
	}
}

// createLogger is now imported from utils/logger

function resolveConfigPath(config?: string): string | undefined {
	if (!config) return undefined;
	const p = path.isAbsolute(config)
		? config
		: path.resolve(process.cwd(), config);
	return p;
}

function collectCommonOptions(cmd: Command) {
	return cmd
		.option('--mode <env>', 'Environment mode (loads .env.<env> file)')
		.option('--desc <text>', 'Version description')
		.option('--ver <x.y.z>', 'Version number')
		.option('--config <path>', 'Custom configuration file path')
		.option('--dry-run', 'Only print planned steps without calling CI')
		.option('--verbose', 'Output detailed logs')
		.option('--json', 'Output structured JSON format results');
}

collectCommonOptions(
	program
		.command('preview')
		.description(translate('cli.commands.preview.description'))
		.action(async (options) => {
			try {
				loadEnv(options.mode);
				const logger = createLogger(options.verbose);
				await runPreview({
					mode: options.mode,
					desc: options.desc,
					ver: options.ver,
					config: resolveConfigPath(options.config),
					dryRun: !!options.dryRun,
					verbose: !!options.verbose,
					json: !!options.json,
					logger,
				});
				process.exit(ExitCodes.SUCCESS);
			} catch (err) {
				const exitCode = handleError(err, console);
				process.exit(exitCode);
			}
		})
);

collectCommonOptions(
	program
		.command('deploy')
		.description(translate('cli.commands.deploy.description'))
		.action(async (options) => {
			try {
				loadEnv(options.mode);
				const logger = createLogger(options.verbose);
				await runDeploy({
					mode: options.mode,
					desc: options.desc,
					ver: options.ver,
					config: resolveConfigPath(options.config),
					dryRun: !!options.dryRun,
					verbose: !!options.verbose,
					json: !!options.json,
					logger,
				});
				process.exit(ExitCodes.SUCCESS);
			} catch (err) {
				const exitCode = handleError(err, console);
				process.exit(exitCode);
			}
		})
);

program
	.command('init')
	.description(translate('cli.commands.init.description'))
	.option('--force', 'Overwrite existing configuration file')
	.action(async (options) => {
		try {
			const logger = createLogger(false); // Init command doesn't need verbose by default
			await runInit({
				logger,
				force: !!options.force,
				cwd: process.cwd(),
			});
			process.exit(ExitCodes.SUCCESS);
		} catch (err) {
			const exitCode = handleError(err, console);
			process.exit(exitCode);
		}
	});

program.parseAsync(process.argv);
