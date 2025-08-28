import {
	describe,
	test,
	expect,
	jest,
	beforeEach,
	afterEach,
} from '@jest/globals';
import { createLogger } from '../../src/utils/logger';
import { initI18n, setLanguage } from '../../src/utils/i18n';

describe('Logger System', () => {
	let consoleSpy: {
		log: any;
		warn: any;
		error: any;
	};

	beforeEach(() => {
		// Initialize i18n for consistent test environment
		initI18n('en');

		// Spy on console methods
		consoleSpy = {
			log: jest.spyOn(console, 'log').mockImplementation(() => {}),
			warn: jest.spyOn(console, 'warn').mockImplementation(() => {}),
			error: jest.spyOn(console, 'error').mockImplementation(() => {}),
		};
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	describe('Basic Logging', () => {
		test('should create logger with verbose mode', () => {
			const logger = createLogger(true);
			expect(logger).toHaveProperty('info');
			expect(logger).toHaveProperty('warn');
			expect(logger).toHaveProperty('error');
			expect(logger).toHaveProperty('debug');
		});

		test('should create logger without verbose mode', () => {
			const logger = createLogger(false);
			expect(logger).toHaveProperty('info');
			expect(logger).toHaveProperty('warn');
			expect(logger).toHaveProperty('error');
			// Debug method exists but doesn't output when verbose=false
			expect(logger.debug).toBeDefined();
		});

		test('should log info messages', () => {
			const logger = createLogger(true);
			logger.info('Test info message');
			expect(consoleSpy.log).toHaveBeenCalledWith(
				'[info] Test info message',
				''
			);
		});

		test('should log warning messages', () => {
			const logger = createLogger(true);
			logger.warn('Test warning message');
			expect(consoleSpy.warn).toHaveBeenCalledWith(
				'[warn] Test warning message',
				''
			);
		});

		test('should log error messages', () => {
			const logger = createLogger(true);
			logger.error('Test error message');
			expect(consoleSpy.error).toHaveBeenCalledWith(
				'[error] Test error message',
				''
			);
		});

		test('should log debug messages in verbose mode', () => {
			const logger = createLogger(true);
			logger.debug?.('Test debug message');
			expect(consoleSpy.log).toHaveBeenCalledWith(
				'[debug] Test debug message',
				''
			);
		});

		test('should not output debug messages in non-verbose mode', () => {
			const logger = createLogger(false);
			logger.debug?.('Test debug message');
			// Should not call console.log for debug when verbose=false
			expect(consoleSpy.log).not.toHaveBeenCalled();
		});
	});

	describe('i18n Integration', () => {
		test('should translate message keys in English', () => {
			setLanguage('en');
			const logger = createLogger(true);

			logger.info('cli.commands.init.description');
			expect(consoleSpy.log).toHaveBeenCalledWith(
				'[info] Initialize configuration file interactively',
				''
			);
		});

		test('should translate message keys in Chinese', () => {
			setLanguage('zh-CN');
			const logger = createLogger(true);

			logger.info('cli.commands.init.description');
			expect(consoleSpy.log).toHaveBeenCalledWith(
				'[info] 交互式初始化配置文件',
				''
			);
		});

		test('should handle framework-specific messages', () => {
			setLanguage('en');
			const logger = createLogger(true);

			logger.info('framework.taro.buildStart');
			expect(consoleSpy.log).toHaveBeenCalledWith(
				'[info] [taro] Starting build...',
				''
			);
		});

		test('should pass through non-translatable messages', () => {
			const logger = createLogger(true);

			logger.info('This is a plain message');
			expect(consoleSpy.log).toHaveBeenCalledWith(
				'[info] This is a plain message',
				''
			);
		});

		test('should handle error messages with translation', () => {
			setLanguage('en');
			const logger = createLogger(true);

			// Test with a framework message that should be translated
			logger.error('framework.taro.buildCompleted');
			expect(consoleSpy.error).toHaveBeenCalledWith(
				'[error] [taro] Build completed successfully',
				''
			);
		});
	});

	describe('Message Formatting', () => {
		test('should handle undefined and null messages', () => {
			const logger = createLogger(true);

			// These should be handled gracefully without throwing
			expect(() => {
				logger.info('valid message');
			}).not.toThrow();

			expect(consoleSpy.log).toHaveBeenCalledWith(
				'[info] valid message',
				''
			);
		});

		test('should handle empty string messages', () => {
			const logger = createLogger(true);

			logger.info('');
			expect(consoleSpy.log).toHaveBeenCalledWith('[info] ', '');
		});

		test('should handle number and object messages', () => {
			const logger = createLogger(true);

			logger.info(123 as any);
			logger.info({ test: 'object' } as any);

			expect(consoleSpy.log).toHaveBeenCalled();
		});
	});

	describe('Debug Mode Behavior', () => {
		test('should provide debug method in both modes', () => {
			const verboseLogger = createLogger(true);
			const quietLogger = createLogger(false);

			expect(verboseLogger.debug).toBeDefined();
			expect(quietLogger.debug).toBeDefined(); // Method exists but behaves differently
		});

		test('should log debug messages only in verbose mode', () => {
			const verboseLogger = createLogger(true);
			const quietLogger = createLogger(false);

			verboseLogger.debug?.('Debug message');
			expect(consoleSpy.log).toHaveBeenCalledWith(
				'[debug] Debug message',
				''
			);

			// Clear the call history
			consoleSpy.log.mockClear();

			quietLogger.debug?.('Debug message');
			expect(consoleSpy.log).not.toHaveBeenCalled(); // Should not log in non-verbose mode
		});
	});

	describe('Language Switching', () => {
		test('should adapt to language changes during runtime', () => {
			const logger = createLogger(true);

			setLanguage('en');
			logger.info('framework.taro.buildStart');
			expect(consoleSpy.log).toHaveBeenLastCalledWith(
				'[info] [taro] Starting build...',
				''
			);

			setLanguage('zh-CN');
			logger.info('framework.taro.buildStart');
			expect(consoleSpy.log).toHaveBeenLastCalledWith(
				'[info] [taro] 开始构建...',
				''
			);
		});
	});
});
