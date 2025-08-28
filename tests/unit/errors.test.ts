import { describe, test, expect, jest } from '@jest/globals';
import { Errors, handleError } from '../../src/utils/errors';
import { ExitCodes } from '../../src/utils/exit-codes';

describe('Error System', () => {
	describe('Error Creation', () => {
		test('should create configuration not found error', () => {
			const error = Errors.configNotFound('test-path');
			expect(error.message).toContain('test-path');
			expect(error.name).toBe('NexusError');
			expect(error.code).toBe(ExitCodes.ERROR_CONFIG_NOT_FOUND);
		});

		test('should create configuration invalid error', () => {
			const error = Errors.configInvalid('Invalid syntax');
			expect(error.message).toContain('Invalid syntax');
			expect(error.name).toBe('NexusError');
			expect(error.code).toBe(ExitCodes.ERROR_CONFIG_INVALID);
		});

		test('should create file not found error', () => {
			const error = Errors.fileNotFound('missing-file.txt');
			expect(error.message).toContain('missing-file.txt');
			expect(error.name).toBe('NexusError');
			expect(error.code).toBe(ExitCodes.ERROR_FILE_NOT_FOUND);
		});

		test('should create build tool not found error', () => {
			const error = Errors.buildToolNotFound('taro-cli');
			expect(error.message).toContain('taro-cli');
			expect(error.name).toBe('NexusError');
			expect(error.code).toBe(ExitCodes.ERROR_BUILD_TOOL_NOT_FOUND);
		});

		test('should create build failed error with details', () => {
			const details = {
				exitCode: 1,
				stderr: 'Build failed with syntax error',
				suggestion: 'Check your code syntax',
			};
			const error = Errors.buildFailed('Taro', details);
			expect(error.message).toContain('Taro');
			expect(error.name).toBe('NexusError');
			expect(error.code).toBe(ExitCodes.ERROR_BUILD_FAILED);
		});

		test('should create deploy failed error', () => {
			const error = Errors.deployFailed('Upload timeout');
			expect(error.message).toContain('Upload timeout');
			expect(error.name).toBe('NexusError');
			expect(error.code).toBe(ExitCodes.ERROR_DEPLOY_FAILED);
		});

		test('should create network error', () => {
			const error = Errors.networkError('Connection refused');
			expect(error.message).toContain('Connection refused');
			expect(error.name).toBe('NexusError');
			expect(error.code).toBe(ExitCodes.ERROR_NETWORK);
		});
	});

	describe('Error Handling', () => {
		test('should handle configuration errors with correct exit code', () => {
			const mockConsole = {
				error: jest.fn(),
				log: jest.fn(),
			};

			const configError = Errors.configNotFound('test.config');
			const exitCode = handleError(configError, mockConsole);

			expect(exitCode).toBe(ExitCodes.ERROR_CONFIG_NOT_FOUND);
			expect(mockConsole.error).toHaveBeenCalled();
		});

		test('should handle build errors with correct exit code', () => {
			const mockConsole = {
				error: jest.fn(),
				log: jest.fn(),
			};

			const buildError = Errors.buildFailed('Taro', { exitCode: 1 });
			const exitCode = handleError(buildError, mockConsole);

			expect(exitCode).toBe(ExitCodes.ERROR_BUILD_FAILED);
			expect(mockConsole.error).toHaveBeenCalled();
		});

		test('should handle unknown errors with generic exit code', () => {
			const mockConsole = {
				error: jest.fn(),
				log: jest.fn(),
			};

			const genericError = new Error('Unknown error');
			const exitCode = handleError(genericError, mockConsole);

			expect(exitCode).toBe(ExitCodes.ERROR_UNKNOWN);
			expect(mockConsole.error).toHaveBeenCalled();
		});

		test('should handle string errors', () => {
			const mockConsole = {
				error: jest.fn(),
				log: jest.fn(),
			};

			const exitCode = handleError('String error message', mockConsole);

			expect(exitCode).toBe(ExitCodes.ERROR_UNKNOWN);
			expect(mockConsole.error).toHaveBeenCalledWith(
				'[Error] String error message'
			);
		});
	});

	describe('Exit Codes', () => {
		test('should have all required exit codes defined', () => {
			expect(ExitCodes.SUCCESS).toBe(0);
			expect(ExitCodes.ERROR_UNKNOWN).toBe(1);
			expect(ExitCodes.ERROR_INVALID_ARGUMENTS).toBe(2);
			expect(ExitCodes.ERROR_CONFIG_NOT_FOUND).toBe(3);
			expect(ExitCodes.ERROR_CONFIG_INVALID).toBe(4);
			expect(ExitCodes.ERROR_FILE_NOT_FOUND).toBe(20);
			expect(ExitCodes.ERROR_BUILD_FAILED).toBe(60);
			expect(ExitCodes.ERROR_DEPLOY_FAILED).toBe(80);
		});

		test('should have unique exit codes', () => {
			const codes = Object.values(ExitCodes);
			const uniqueCodes = new Set(codes);
			expect(codes.length).toBe(uniqueCodes.size);
		});
	});
});
