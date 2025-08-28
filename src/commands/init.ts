import inquirer from 'inquirer';
import path from 'node:path';
import fs from 'node:fs/promises';
import type { Logger, NexusConfig } from '../types';
import { createTaroAdapter } from '../adapters/framework/taro';
import { createUniAppAdapter } from '../adapters/framework/uni';
import { Errors } from '../utils/errors';
import { translate } from '../utils/i18n';

export interface InitOptions {
	logger: Logger;
	force?: boolean;
	cwd?: string;
}

interface InitAnswers {
	projectType: 'taro' | 'uni-app' | 'other';
	platform: 'weapp' | 'alipay' | 'tt' | 'qq';
	appId: string;
	privateKeyPath: string;
	projectPath: string;
	outputDir: string;
	useEnvFile: boolean;
}

export async function runInit(options: InitOptions): Promise<void> {
	const { logger, force = false, cwd = process.cwd() } = options;
	const configPath = path.resolve(cwd, 'mp-nexus.config.js');

	// Check if config file already exists
	try {
		await fs.access(configPath);
		if (!force) {
			const { overwrite } = await inquirer.prompt([
				{
					type: 'confirm',
					name: 'overwrite',
					message: translate('cli.commands.init.prompts.overwrite'),
					default: false,
				},
			]);

			if (!overwrite) {
				logger.info('cli.commands.init.messages.cancelled');
				return;
			}
		}
	} catch {
		// File doesn't exist, continue with init
	}

	logger.info('cli.commands.init.messages.starting');

	// Detect project type automatically
	const detectedFramework = await detectFramework(cwd, logger);

	// Start interactive prompts
	const answers = await collectConfiguration(detectedFramework, logger);

	// Generate configuration
	const config = generateConfig(answers);

	// Write configuration file
	await writeConfigFile(configPath, config, logger);

	// Generate .env file if requested
	if (answers.useEnvFile) {
		await generateEnvFile(cwd, answers, logger);
	}

	// Show completion message with next steps
	showCompletionMessage(answers, logger);
}

async function detectFramework(
	cwd: string,
	logger: Logger
): Promise<'taro' | 'uni-app' | 'unknown'> {
	const taro = createTaroAdapter();
	const uni = createUniAppAdapter();

	if (await taro.detect(cwd)) {
		logger.info('✅ Detected Taro project');
		return 'taro';
	}

	if (await uni.detect(cwd)) {
		logger.info('✅ Detected uni-app project');
		return 'uni-app';
	}

	logger.warn('⚠️  Could not detect framework automatically');
	return 'unknown';
}

async function collectConfiguration(
	detectedFramework: 'taro' | 'uni-app' | 'unknown',
	logger: Logger
): Promise<InitAnswers> {
	logger.info('cli.commands.init.messages.collectingInfo');

	return await inquirer.prompt([
		{
			type: 'list',
			name: 'projectType',
			message: translate('cli.commands.init.prompts.framework'),
			choices: [
				{ name: translate('choices.frameworks.taro'), value: 'taro' },
				{
					name: translate('choices.frameworks.uniapp'),
					value: 'uni-app',
				},
				{ name: translate('choices.frameworks.other'), value: 'other' },
			],
			default:
				detectedFramework !== 'unknown' ? detectedFramework : 'taro',
		},
		{
			type: 'list',
			name: 'platform',
			message: translate('cli.commands.init.prompts.platform'),
			choices: [
				{ name: translate('choices.platforms.weapp'), value: 'weapp' },
				{
					name: translate('choices.platforms.alipay'),
					value: 'alipay',
				},
				{ name: translate('choices.platforms.tt'), value: 'tt' },
				{ name: translate('choices.platforms.qq'), value: 'qq' },
			],
			default: 'weapp',
		},
		{
			type: 'input',
			name: 'appId',
			message: translate('cli.commands.init.prompts.appId'),
			validate: (input: string) => {
				if (!input.trim()) {
					return translate(
						'cli.commands.init.validation.appIdRequired'
					);
				}
				if (input.length < 10) {
					return translate(
						'cli.commands.init.validation.appIdTooShort'
					);
				}
				return true;
			},
		},
		{
			type: 'input',
			name: 'privateKeyPath',
			message: translate('cli.commands.init.prompts.privateKeyPath'),
			default: './private.key',
			validate: (input: string) => {
				if (!input.trim()) {
					return translate(
						'cli.commands.init.validation.privateKeyRequired'
					);
				}
				return true;
			},
		},
		{
			type: 'input',
			name: 'projectPath',
			message: translate('cli.commands.init.prompts.projectPath'),
			default: '.',
			validate: (input: string) => {
				if (!input.trim()) {
					return translate(
						'cli.commands.init.validation.projectPathRequired'
					);
				}
				return true;
			},
		},
		{
			type: 'input',
			name: 'outputDir',
			message: translate('cli.commands.init.prompts.outputDir'),
			default: (answers: Partial<InitAnswers>) => {
				switch (answers.projectType) {
					case 'taro':
						return 'dist/weapp';
					case 'uni-app':
						return 'dist/build/mp-weixin';
					default:
						return 'dist';
				}
			},
			validate: (input: string) => {
				if (!input.trim()) {
					return translate(
						'cli.commands.init.validation.outputDirRequired'
					);
				}
				return true;
			},
		},
		{
			type: 'confirm',
			name: 'useEnvFile',
			message: translate('cli.commands.init.prompts.useEnvFile'),
			default: true,
		},
	]);
}

function generateConfig(answers: InitAnswers): NexusConfig {
	const config: NexusConfig = {
		projectType:
			answers.projectType === 'other' ? undefined : answers.projectType,
		platform: answers.platform as any,
		appId: answers.useEnvFile ? 'process.env.MP_APP_ID' : answers.appId,
		privateKeyPath: answers.useEnvFile
			? 'process.env.MP_PRIVATE_KEY_PATH || "./private.key"'
			: answers.privateKeyPath,
		projectPath: answers.projectPath,
		outputDir: answers.outputDir,
		ciOptions: {},
	};

	return config;
}

async function writeConfigFile(
	configPath: string,
	config: NexusConfig,
	logger: Logger
): Promise<void> {
	const configContent = `// mp-nexus-cli configuration
// Generated by 'nexus init' command

/** @type {import('mp-nexus-cli').NexusConfig} */
module.exports = {
	// Project framework type (auto-detected if not specified)
	${
		config.projectType
			? `projectType: '${config.projectType}',`
			: "// projectType: 'taro' | 'uni-app',"
	}

	// Target platform
	platform: '${config.platform}',

	// Mini program App ID
	appId: ${
		typeof config.appId === 'string' &&
		config.appId.startsWith('process.env')
			? config.appId
			: `'${config.appId}'`
	},

	// Path to private key file
	privateKeyPath: ${
		typeof config.privateKeyPath === 'string' &&
		config.privateKeyPath.includes('process.env')
			? config.privateKeyPath
			: `'${config.privateKeyPath}'`
	},

	// Project root path
	projectPath: '${config.projectPath}',

	// Build output directory
	outputDir: '${config.outputDir}',

	// Additional CI options
	ciOptions: {
		// Custom settings for miniprogram-ci
		// setting: {
		//   es6: true,
		//   minify: true,
		//   codeProtect: true,
		// },
	},

	// Optional: Notification settings
	// notify: {
	//   webhook: 'https://your-webhook-url',
	//   provider: 'feishu', // 'feishu' | 'dingtalk' | 'wechat'
	// },
};
`;

	try {
		await fs.writeFile(configPath, configContent, 'utf-8');
		logger.info(`✅ Configuration file created: ${configPath}`);
	} catch (error) {
		throw Errors.fileNotFound(configPath);
	}
}

async function generateEnvFile(
	cwd: string,
	answers: InitAnswers,
	logger: Logger
): Promise<void> {
	const envPath = path.resolve(cwd, '.env');
	const envContent = `# mp-nexus-cli environment variables
# Generated by 'nexus init' command
# 
# ⚠️  IMPORTANT: Add this file to .gitignore to keep sensitive data secure!

# Mini program App ID
MP_APP_ID=${answers.appId}

# Path to private key file
MP_PRIVATE_KEY_PATH=${answers.privateKeyPath}

# Optional: Additional environment-specific settings
# NODE_ENV=development
`;

	try {
		await fs.writeFile(envPath, envContent, 'utf-8');
		logger.info(`✅ Environment file created: ${envPath}`);

		// Check and update .gitignore
		await updateGitignore(cwd, logger);
	} catch (error) {
		logger.warn(
			`⚠️  Could not create .env file: ${
				error instanceof Error ? error.message : String(error)
			}`
		);
	}
}

async function updateGitignore(cwd: string, logger: Logger): Promise<void> {
	const gitignorePath = path.resolve(cwd, '.gitignore');

	try {
		let gitignoreContent = '';
		try {
			gitignoreContent = await fs.readFile(gitignorePath, 'utf-8');
		} catch {
			// .gitignore doesn't exist, we'll create it
		}

		if (!gitignoreContent.includes('.env')) {
			const newContent =
				gitignoreContent +
				(gitignoreContent ? '\n' : '') +
				'# Environment variables\n.env\n.env.local\n.env.*.local\n';

			await fs.writeFile(gitignorePath, newContent, 'utf-8');
			logger.info('✅ Updated .gitignore to include .env files');
		}
	} catch (error) {
		logger.warn('⚠️  Could not update .gitignore file');
	}
}

function showCompletionMessage(answers: InitAnswers, logger: Logger): void {
	logger.info('\n🎉 Configuration completed successfully!\n');

	logger.info('Next steps:');
	logger.info('1. Verify your configuration in mp-nexus.config.js');
	logger.info(
		`2. Download your private key from WeChat Mini Program console:`
	);
	logger.info(`   - Visit https://mp.weixin.qq.com`);
	logger.info(`   - Go to 开发 → 开发管理 → 开发设置`);
	logger.info(`   - Download "代码上传密钥" and save as: ${answers.privateKeyPath}`);
	logger.info(`   - See docs/private-key-guide.md for detailed instructions`);

	if (answers.useEnvFile) {
		logger.info(
			'3. Review and update the .env file with your actual values'
		);
		logger.info('4. Make sure .env is added to your .gitignore file');
	}

	logger.info('\nYou can now run:');
	logger.info('  nexus preview  - Generate preview QR code');
	logger.info('  nexus deploy   - Deploy to production');
	logger.info('\nFor more options, run: nexus --help\n');
}
