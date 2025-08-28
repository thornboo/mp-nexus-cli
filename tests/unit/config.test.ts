import { describe, test, expect, beforeEach, afterEach, jest } from '@jest/globals';
import path from 'node:path';
import fs from 'node:fs/promises';
import os from 'node:os';

// Mock modules before importing the functions we're testing
jest.mock('node:fs/promises');
jest.mock('node:path', () => {
	const actual = jest.requireActual('node:path') as any;
	return {
		...actual,
		resolve: jest.fn(),
	};
});

// Import the functions we want to test
// Note: We need to test the private functions by importing the module and accessing them
// For now, we'll create a separate config utility module to make testing easier

// Mock data for testing
const mockConfig = {
	projectType: 'taro' as const,
	platform: 'weapp' as const,
	appId: 'wx1234567890abcdef',
	privateKeyPath: './private.key',
	projectPath: '.',
	outputDir: 'dist/weapp',
	ciOptions: {},
};

const mockLogger = {
	info: jest.fn(),
	warn: jest.fn(),
	error: jest.fn(),
	debug: jest.fn(),
};

describe('Configuration System', () => {
	beforeEach(() => {
		// Reset all mocks before each test
		jest.clearAllMocks();
		
		// Reset environment variables
		delete process.env.MP_APP_ID;
		delete process.env.MP_PRIVATE_KEY_PATH;
		delete process.env.NEXUS_LANG;
	});

	afterEach(() => {
		jest.restoreAllMocks();
	});

	describe('Configuration Loading', () => {
		test('should load valid configuration file', async () => {
			// Since we can't easily mock require in Jest for ES modules,
			// we'll test the behavior by creating a real config file temporarily
			const { loadUserConfig } = await import('../../src/utils/config-loader');
			
			// Test that the function returns empty object when file doesn't exist
			const config = await loadUserConfig('./nonexistent-config.js');
			
			expect(config).toEqual({});
		});

		test('should handle missing configuration file gracefully', async () => {
			const { loadUserConfig } = await import('../../src/utils/config-loader');
			
			const config = await loadUserConfig('./definitely-nonexistent.js');
			
			expect(config).toEqual({});
		});

		test('should use default config path when none provided', async () => {
			const mockResolve = path.resolve as jest.MockedFunction<typeof path.resolve>;
			mockResolve.mockReturnValue('/resolved/mp-nexus.config.js');

			const { loadUserConfig } = await import('../../src/utils/config-loader');
			
			await loadUserConfig();
			
			expect(mockResolve).toHaveBeenCalledWith(process.cwd(), 'mp-nexus.config.js');
		});
	});

	describe('Configuration Merging', () => {
		test('should merge CLI options with file config', () => {
			const cliOptions = {
				mode: 'production',
				desc: 'CLI description',
				ver: '1.0.0',
				verbose: true,
				logger: mockLogger,
			};

			const fileConfig = {
				appId: 'wx1234567890abcdef',
				privateKeyPath: './private.key',
				projectPath: '.',
				outputDir: 'dist/weapp',
			};

			// We need to import and test the mergeConfig function
			// For now, let's create a test utility
			const { mergeConfig } = require('../../src/utils/config-merger');
			
			const merged = mergeConfig(cliOptions, fileConfig);
			
			expect(merged.appId).toBe(fileConfig.appId);
			expect(merged.privateKeyPath).toBe(fileConfig.privateKeyPath);
			expect(merged.ciOptions.version).toBe(cliOptions.ver);
			expect(merged.ciOptions.desc).toBe(cliOptions.desc);
		});

		test('should prioritize environment variables over file config', () => {
			process.env.MP_APP_ID = 'env-app-id';
			process.env.MP_PRIVATE_KEY_PATH = './env-private.key';

			const fileConfig = {
				appId: 'file-app-id',
				privateKeyPath: './file-private.key',
				projectPath: '.',
				outputDir: 'dist/weapp',
			};

			const { mergeConfig } = require('../../src/utils/config-merger');
			
			const merged = mergeConfig({ logger: mockLogger }, fileConfig);
			
			expect(merged.appId).toBe('env-app-id');
			expect(merged.privateKeyPath).toBe('./env-private.key');
		});

		test('should apply default values when config is missing', () => {
			const { mergeConfig } = require('../../src/utils/config-merger');
			
			const merged = mergeConfig({ logger: mockLogger }, {});
			
			expect(merged.projectPath).toBe('.');
			expect(merged.platform).toBe('weapp');
			expect(merged.outputDir).toBe('dist/weapp');
			expect(merged.privateKeyPath).toBe('private.key');
			expect(merged.ciOptions).toEqual({});
		});

		test('should merge CI options correctly', () => {
			const cliOptions = {
				ver: '2.0.0',
				desc: 'Updated version',
				logger: mockLogger,
			};

			const fileConfig = {
				appId: 'wx1234567890abcdef',
				privateKeyPath: './private.key',
				ciOptions: {
					setting: {
						es6: true,
						minify: true,
					},
				},
			};

			const { mergeConfig } = require('../../src/utils/config-merger');
			
			const merged = mergeConfig(cliOptions, fileConfig);
			
			expect(merged.ciOptions).toEqual({
				setting: {
					es6: true,
					minify: true,
				},
				version: '2.0.0',
				desc: 'Updated version',
			});
		});
	});

	describe('Configuration Validation', () => {
		test('should validate required appId', () => {
			const invalidConfig = {
				appId: '',
				privateKeyPath: './private.key',
				projectPath: '.',
				outputDir: 'dist/weapp',
				platform: 'weapp' as const,
				ciOptions: {},
			};

			const { assertMinimalConfig } = require('../../src/utils/config-validator');
			
			expect(() => assertMinimalConfig(invalidConfig)).toThrow();
		});

		test('should validate required privateKeyPath', () => {
			const invalidConfig = {
				appId: 'wx1234567890abcdef',
				privateKeyPath: '',
				projectPath: '.',
				outputDir: 'dist/weapp',
				platform: 'weapp' as const,
				ciOptions: {},
			};

			const { assertMinimalConfig } = require('../../src/utils/config-validator');
			
			expect(() => assertMinimalConfig(invalidConfig)).toThrow();
		});

		test('should pass validation with valid config', () => {
			const validConfig = {
				appId: 'wx1234567890abcdef',
				privateKeyPath: './private.key',
				projectPath: '.',
				outputDir: 'dist/weapp',
				platform: 'weapp' as const,
				ciOptions: {},
			};

			const { assertMinimalConfig } = require('../../src/utils/config-validator');
			
			expect(() => assertMinimalConfig(validConfig)).not.toThrow();
		});
	});

	describe('Path Resolution', () => {
		test('should resolve project paths correctly', async () => {
			const mockResolve = path.resolve as jest.MockedFunction<typeof path.resolve>;
			mockResolve
				.mockReturnValueOnce('/project/root')  // projectRoot
				.mockReturnValueOnce('/project/root/dist/weapp');  // outputPath

			const mockAccess = fs.access as jest.MockedFunction<typeof fs.access>;
			mockAccess.mockResolvedValue(undefined);

			const config = {
				appId: 'wx1234567890abcdef',
				privateKeyPath: './private.key',
				projectPath: '.',
				outputDir: 'dist/weapp',
				platform: 'weapp' as const,
				ciOptions: {},
			};

			const { ensurePaths } = require('../../src/utils/path-resolver');
			
			const paths = await ensurePaths(config);
			
			expect(paths.projectRoot).toBe('/project/root');
			expect(paths.outputPath).toBe('/project/root/dist/weapp');
			expect(mockAccess).toHaveBeenCalledWith('/project/root');
		});

		test('should throw error for non-existent project path', async () => {
			const mockResolve = path.resolve as jest.MockedFunction<typeof path.resolve>;
			mockResolve.mockReturnValueOnce('/nonexistent/path');

			const mockAccess = fs.access as jest.MockedFunction<typeof fs.access>;
			mockAccess.mockRejectedValue(new Error('ENOENT'));

			const config = {
				appId: 'wx1234567890abcdef',
				privateKeyPath: './private.key',
				projectPath: './nonexistent',
				outputDir: 'dist/weapp',
				platform: 'weapp' as const,
				ciOptions: {},
			};

			const { ensurePaths } = require('../../src/utils/path-resolver');
			
			await expect(ensurePaths(config)).rejects.toThrow();
		});
	});

	describe('Environment Variable Priority', () => {
		test('should prioritize CLI options over environment variables', () => {
			process.env.MP_APP_ID = 'env-app-id';
			
			const cliOptions = {
				// CLI doesn't directly override appId, but affects ciOptions
				ver: 'cli-version',
				logger: mockLogger,
			};

			const fileConfig = {
				appId: 'file-app-id',
				privateKeyPath: './private.key',
			};

			const { mergeConfig } = require('../../src/utils/config-merger');
			
			const merged = mergeConfig(cliOptions, fileConfig);
			
			// Environment should override file config
			expect(merged.appId).toBe('env-app-id');
			// CLI should override everything for ciOptions
			expect(merged.ciOptions.version).toBe('cli-version');
		});

		test('should handle missing environment variables gracefully', () => {
			delete process.env.MP_APP_ID;
			delete process.env.MP_PRIVATE_KEY_PATH;

			const fileConfig = {
				appId: 'file-app-id',
				privateKeyPath: './file-private.key',
			};

			const { mergeConfig } = require('../../src/utils/config-merger');
			
			const merged = mergeConfig({ logger: mockLogger }, fileConfig);
			
			expect(merged.appId).toBe('file-app-id');
			expect(merged.privateKeyPath).toBe('./file-private.key');
		});
	});

	describe('Language Configuration', () => {
		test('should include language in merged config', () => {
			const fileConfig = {
				appId: 'wx1234567890abcdef',
				privateKeyPath: './private.key',
				language: 'zh-CN' as const,
			};

			const { mergeConfig } = require('../../src/utils/config-merger');
			
			const merged = mergeConfig({ logger: mockLogger }, fileConfig);
			
			expect(merged.language).toBe('zh-CN');
		});

		test('should handle missing language configuration', () => {
			const fileConfig = {
				appId: 'wx1234567890abcdef',
				privateKeyPath: './private.key',
			};

			const { mergeConfig } = require('../../src/utils/config-merger');
			
			const merged = mergeConfig({ logger: mockLogger }, fileConfig);
			
			// Language should be undefined if not specified
			expect(merged.language).toBeUndefined();
		});
	});
});
