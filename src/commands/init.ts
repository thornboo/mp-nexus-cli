import inquirer from 'inquirer';
import path from 'node:path';
import fs from 'node:fs/promises';
import type { Logger, NexusConfig } from '../types';
import { createTaroAdapter } from '../adapters/framework/taro';
import { createUniAppAdapter } from '../adapters/framework/uni';
import { Errors } from '../utils/errors';

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
					message: 'Configuration file already exists. Overwrite?',
					default: false,
				},
			]);

			if (!overwrite) {
				logger.info('Init cancelled by user');
				return;
			}
		}
	} catch {
		// File doesn't exist, continue with init
	}

	logger.info('🚀 Initializing mp-nexus-cli configuration...\n');

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
	logger.info('Please provide the following information:\n');

	return await inquirer.prompt([
		{
			type: 'list',
			name: 'projectType',
			message: 'What framework does your project use?',
			choices: [
				{ name: 'Taro', value: 'taro' },
				{ name: 'uni-app', value: 'uni-app' },
				{ name: 'Other/Manual setup', value: 'other' },
			],
			default:
				detectedFramework !== 'unknown' ? detectedFramework : 'taro',
		},
		{
			type: 'list',
			name: 'platform',
			message: 'Which platform do you want to deploy to?',
			choices: [
				{ name: 'WeChat Mini Program (weapp)', value: 'weapp' },
				{ name: 'Alipay Mini Program (alipay)', value: 'alipay' },
				{ name: 'ByteDance Mini Program (tt)', value: 'tt' },
				{ name: 'QQ Mini Program (qq)', value: 'qq' },
			],
			default: 'weapp',
		},
		{
			type: 'input',
			name: 'appId',
			message: 'Enter your App ID:',
			validate: (input: string) => {
				if (!input.trim()) {
					return 'App ID is required';
				}
				if (input.length < 10) {
					return 'App ID seems too short. Please verify.';
				}
				return true;
			},
		},
		{
			type: 'input',
			name: 'privateKeyPath',
			message: 'Enter the path to your private key file:',
			default: './private.key',
			validate: (input: string) => {
				if (!input.trim()) {
					return 'Private key path is required';
				}
				return true;
			},
		},
		{
			type: 'input',
			name: 'projectPath',
			message: 'Enter your project path:',
			default: '.',
			validate: (input: string) => {
				if (!input.trim()) {
					return 'Project path is required';
				}
				return true;
			},
		},
		{
			type: 'input',
			name: 'outputDir',
			message: 'Enter the build output directory:',
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
					return 'Output directory is required';
				}
				return true;
			},
		},
		{
			type: 'confirm',
			name: 'useEnvFile',
			message: 'Create .env file for sensitive configuration?',
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
		`2. Ensure your private key file exists at: ${answers.privateKeyPath}`
	);

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
