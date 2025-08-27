import path from 'node:path';
import fs from 'node:fs';
import os from 'node:os';

/** Supported languages */
export type Language = 'en' | 'zh-CN';

/** Translation message key-value pairs */
export interface Messages {
	[key: string]: string | Messages;
}

/** Translation function type */
export type TranslationFunction = (
	key: string,
	params?: Record<string, string | number>
) => string;

/** Global i18n configuration */
interface I18nConfig {
	language: Language;
	fallbackLanguage: Language;
	messages: Record<Language, Messages>;
}

let globalConfig: I18nConfig = {
	language: 'en',
	fallbackLanguage: 'en',
	messages: {
		en: {},
		'zh-CN': {},
	},
};

/**
 * Initialize i18n system with language and load messages
 */
export function initI18n(language?: Language): void {
	const detectedLanguage = language || detectSystemLanguage();
	globalConfig.language = detectedLanguage;

	// Load message dictionaries
	loadMessages();
}

/**
 * Detect system language from environment
 */
export function detectSystemLanguage(): Language {
	// Priority: CLI argument > environment variable > system locale
	const envLang = process.env.NEXUS_LANG || process.env.LANG;

	if (envLang) {
		if (envLang.startsWith('zh')) {
			return 'zh-CN';
		}
		return 'en';
	}

	// Detect from system locale
	const systemLocale =
		os.type() === 'Windows_NT'
			? process.env.LANGUAGE ||
			  process.env.LC_ALL ||
			  process.env.LC_MESSAGES ||
			  process.env.LANG
			: Intl.DateTimeFormat().resolvedOptions().locale;

	if (systemLocale && systemLocale.startsWith('zh')) {
		return 'zh-CN';
	}

	return 'en';
}

/**
 * Set current language
 */
export function setLanguage(language: Language): void {
	globalConfig.language = language;
}

/**
 * Get current language
 */
export function getCurrentLanguage(): Language {
	return globalConfig.language;
}

/**
 * Load message dictionaries for all supported languages
 */
function loadMessages(): void {
	// Inline messages for now to avoid runtime file loading issues
	globalConfig.messages.en = {
		cli: {
			description:
				'mp-nexus-cli: Unified CLI tool for one-click preview/deployment of mini-program projects',
			commands: {
				init: {
					description: 'Initialize configuration file interactively',
					prompts: {
						overwrite:
							'Configuration file already exists. Overwrite?',
						framework: 'What framework does your project use?',
						platform: 'Which platform do you want to deploy to?',
						appId: 'Enter your App ID:',
						privateKeyPath:
							'Enter the path to your private key file:',
						projectPath: 'Enter your project path:',
						outputDir: 'Enter the build output directory:',
						useEnvFile:
							'Create .env file for sensitive configuration?',
					},
					validation: {
						appIdRequired: 'App ID is required',
						appIdTooShort: 'App ID seems too short. Please verify.',
						privateKeyRequired: 'Private key path is required',
						projectPathRequired: 'Project path is required',
						outputDirRequired: 'Output directory is required',
					},
					messages: {
						cancelled: 'Init cancelled by user',
						starting:
							'🚀 Initializing mp-nexus-cli configuration...',
						collectingInfo:
							'Please provide the following information:',
					},
				},
				preview: {
					description: 'Build project and generate preview QR code',
				},
				deploy: {
					description: 'Build project and upload as new version',
				},
			},
		},
		framework: {
			uniapp: {
				buildStart: '[uni-app] Starting build...',
				buildCompleted: '[uni-app] Build completed successfully',
				buildSkipped: '[uni-app] Skip build (NEXUS_SKIP_BUILD=1)',
			},
		},
		choices: {
			frameworks: {
				taro: 'Taro',
				uniapp: 'uni-app',
				other: 'Other/Manual setup',
			},
			platforms: {
				weapp: 'WeChat Mini Program (weapp)',
				alipay: 'Alipay Mini Program (alipay)',
				tt: 'ByteDance Mini Program (tt)',
				qq: 'QQ Mini Program (qq)',
			},
		},
	};

	globalConfig.messages['zh-CN'] = {
		cli: {
			description: 'mp-nexus-cli: 统一小程序项目的一键预览/部署 CLI 工具',
			commands: {
				init: {
					description: '交互式初始化配置文件',
					prompts: {
						overwrite: '配置文件已存在。是否覆盖？',
						framework: '您的项目使用什么框架？',
						platform: '您要部署到哪个平台？',
						appId: '请输入您的 App ID：',
						privateKeyPath: '请输入私钥文件路径：',
						projectPath: '请输入项目路径：',
						outputDir: '请输入构建输出目录：',
						useEnvFile: '是否创建 .env 文件存储敏感配置？',
					},
					validation: {
						appIdRequired: 'App ID 是必需的',
						appIdTooShort: 'App ID 似乎太短了。请验证。',
						privateKeyRequired: '私钥路径是必需的',
						projectPathRequired: '项目路径是必需的',
						outputDirRequired: '输出目录是必需的',
					},
					messages: {
						cancelled: '用户取消了初始化',
						starting: '🚀 正在初始化 mp-nexus-cli 配置...',
						collectingInfo: '请提供以下信息：',
					},
				},
				preview: {
					description: '构建项目并生成预览二维码',
				},
				deploy: {
					description: '构建项目并上传为新版本',
				},
			},
		},
		framework: {
			uniapp: {
				buildStart: '[uni-app] 开始构建...',
				buildCompleted: '[uni-app] 构建完成',
				buildSkipped: '[uni-app] 跳过构建 (NEXUS_SKIP_BUILD=1)',
			},
		},
		choices: {
			frameworks: {
				taro: 'Taro',
				uniapp: 'uni-app',
				other: '其他/手动设置',
			},
			platforms: {
				weapp: '微信小程序 (weapp)',
				alipay: '支付宝小程序 (alipay)',
				tt: '字节跳动小程序 (tt)',
				qq: 'QQ 小程序 (qq)',
			},
		},
	};
}

/**
 * Translate a message key with optional parameters
 */
export function translate(
	key: string,
	params?: Record<string, string | number>
): string {
	const messages =
		globalConfig.messages[globalConfig.language] ||
		globalConfig.messages[globalConfig.fallbackLanguage];

	let message = getNestedMessage(messages, key);

	// Fallback to key if message not found
	if (!message) {
		console.warn(`[i18n] Missing translation for key: ${key}`);
		return key;
	}

	// Replace parameters
	if (params && message) {
		Object.entries(params).forEach(([param, value]) => {
			message = message!.replace(
				new RegExp(`\\{\\{${param}\\}\\}`, 'g'),
				String(value)
			);
		});
	}

	return message;
}

/**
 * Get nested message from object using dot notation
 */
function getNestedMessage(messages: Messages, key: string): string | null {
	const keys = key.split('.');
	let current: any = messages;

	for (const k of keys) {
		if (current && typeof current === 'object' && k in current) {
			current = current[k];
		} else {
			return null;
		}
	}

	return typeof current === 'string' ? current : null;
}

/**
 * Create a scoped translation function for a specific namespace
 */
export function createTranslator(namespace: string): TranslationFunction {
	return (key: string, params?: Record<string, string | number>) => {
		const fullKey = namespace ? `${namespace}.${key}` : key;
		return translate(fullKey, params);
	};
}

/**
 * Global translation function (shorthand)
 */
export const t = translate;

/**
 * Get available languages
 */
export function getAvailableLanguages(): Language[] {
	return ['en', 'zh-CN'];
}

/**
 * Check if a language is supported
 */
export function isLanguageSupported(language: string): language is Language {
	return getAvailableLanguages().includes(language as Language);
}
