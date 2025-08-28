import { jest, beforeAll, afterAll } from '@jest/globals';

// Global test setup
beforeAll(() => {
	// Suppress console output during tests unless explicitly needed
	jest.spyOn(console, 'log').mockImplementation(() => {});
	jest.spyOn(console, 'info').mockImplementation(() => {});
	jest.spyOn(console, 'warn').mockImplementation(() => {});
	jest.spyOn(console, 'error').mockImplementation(() => {});
});

afterAll(() => {
	// Restore console output
	jest.restoreAllMocks();
});

// Set test environment variables
process.env.NODE_ENV = 'test';
process.env.NEXUS_LANG = 'en'; // Use English for consistent test output
