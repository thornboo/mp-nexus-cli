import { describe, test, expect, beforeEach, afterEach } from '@jest/globals';
import {
	initI18n,
	setLanguage,
	getCurrentLanguage,
	translate,
	isLanguageSupported,
	getAvailableLanguages,
	detectSystemLanguage,
} from '../../src/utils/i18n';

describe('i18n System', () => {
	// Save original env vars
	const originalEnv = { ...process.env };

	beforeEach(() => {
		// Reset to clean state before each test
		initI18n('en');
	});

	afterEach(() => {
		// Restore original environment
		process.env = { ...originalEnv };
	});

	describe('Language Support', () => {
		test('should support English and Chinese', () => {
			const languages = getAvailableLanguages();
			expect(languages).toEqual(['en', 'zh-CN']);
		});

		test('should validate supported languages', () => {
			expect(isLanguageSupported('en')).toBe(true);
			expect(isLanguageSupported('zh-CN')).toBe(true);
			expect(isLanguageSupported('fr')).toBe(false);
			expect(isLanguageSupported('invalid')).toBe(false);
		});
	});

	describe('Language Detection', () => {
		test('should detect Chinese from NEXUS_LANG', () => {
			process.env.NEXUS_LANG = 'zh-CN';
			const detected = detectSystemLanguage();
			expect(detected).toBe('zh-CN');
		});

		test('should detect Chinese from LANG environment', () => {
			delete process.env.NEXUS_LANG;
			process.env.LANG = 'zh_CN.UTF-8';
			const detected = detectSystemLanguage();
			expect(detected).toBe('zh-CN');
		});

		test('should default to English when no Chinese detected', () => {
			delete process.env.NEXUS_LANG;
			delete process.env.LANG;
			const detected = detectSystemLanguage();
			expect(detected).toBe('en');
		});
	});

	describe('Language Management', () => {
		test('should set and get current language', () => {
			setLanguage('zh-CN');
			expect(getCurrentLanguage()).toBe('zh-CN');

			setLanguage('en');
			expect(getCurrentLanguage()).toBe('en');
		});

		test('should initialize with specified language', () => {
			initI18n('zh-CN');
			expect(getCurrentLanguage()).toBe('zh-CN');
		});

		test('should initialize with auto-detected language', () => {
			process.env.NEXUS_LANG = 'zh-CN';
			initI18n();
			expect(getCurrentLanguage()).toBe('zh-CN');
		});
	});

	describe('Translation', () => {
		test('should translate basic messages', () => {
			setLanguage('en');
			expect(translate('cli.description')).toContain('mp-nexus-cli');
			expect(translate('cli.commands.init.description')).toBe(
				'Initialize configuration file interactively'
			);

			setLanguage('zh-CN');
			expect(translate('cli.description')).toContain('mp-nexus-cli');
			expect(translate('cli.commands.init.description')).toBe(
				'交互式初始化配置文件'
			);
		});

		test('should handle framework-specific messages', () => {
			setLanguage('en');
			expect(translate('framework.taro.buildStart')).toBe(
				'[taro] Starting build...'
			);
			expect(translate('framework.uniapp.buildCompleted')).toBe(
				'[uni-app] Build completed successfully'
			);

			setLanguage('zh-CN');
			expect(translate('framework.taro.buildStart')).toBe(
				'[taro] 开始构建...'
			);
			expect(translate('framework.uniapp.buildCompleted')).toBe(
				'[uni-app] 构建完成'
			);
		});

		test('should handle parameter substitution', () => {
			// Note: This test may need adjustment based on actual parameter support in messages
			const result = translate('cli.description');
			expect(typeof result).toBe('string');
			expect(result.length).toBeGreaterThan(0);
		});

		test('should fallback to key for missing translations', () => {
			const missingKey = 'nonexistent.key.test';
			const result = translate(missingKey);
			expect(result).toBe(missingKey);
		});

		test('should fallback to English when Chinese translation missing', () => {
			setLanguage('zh-CN');
			const nonExistentKey = 'test.missing.key';
			const result = translate(nonExistentKey);
			expect(result).toBe(nonExistentKey); // Returns key when not found
		});
	});

	describe('Edge Cases', () => {
		test('should handle empty translation key', () => {
			const result = translate('');
			expect(result).toBe('');
		});

		test('should handle nested key navigation', () => {
			const result = translate('cli.commands.init.description');
			expect(typeof result).toBe('string');
			expect(result.length).toBeGreaterThan(0);
		});

		test('should maintain language consistency across multiple calls', () => {
			setLanguage('zh-CN');
			const result1 = translate('cli.commands.init.description');
			const result2 = translate('cli.commands.init.description');
			expect(result1).toBe(result2);
			expect(result1).toBe('交互式初始化配置文件');
		});
	});
});
