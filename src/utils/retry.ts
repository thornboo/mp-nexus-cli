import type { Logger } from '../types';

export interface RetryOptions {
	maxAttempts: number;
	delay: number;
	backoffMultiplier?: number;
	retryCondition?: (error: unknown) => boolean;
	logger?: Logger;
}

export class RetryableOperation {
	private options: Required<RetryOptions>;

	constructor(options: RetryOptions) {
		this.options = {
			maxAttempts: options.maxAttempts,
			delay: options.delay,
			backoffMultiplier: options.backoffMultiplier ?? 1.5,
			retryCondition:
				options.retryCondition ?? this.defaultRetryCondition,
			logger: options.logger ?? this.createNullLogger(),
		};
	}

	async execute<T>(
		operation: () => Promise<T>,
		operationName = 'operation'
	): Promise<T> {
		let lastError: unknown;

		for (let attempt = 1; attempt <= this.options.maxAttempts; attempt++) {
			try {
				this.options.logger.debug?.(
					`[retry] Executing ${operationName}, attempt ${attempt}/${this.options.maxAttempts}`
				);
				const result = await operation();

				if (attempt > 1) {
					this.options.logger.info(
						`[retry] ${operationName} succeeded on attempt ${attempt}`
					);
				}

				return result;
			} catch (error) {
				lastError = error;

				if (attempt === this.options.maxAttempts) {
					this.options.logger.error(
						`[retry] ${operationName} failed after ${attempt} attempts`
					);
					break;
				}

				if (!this.options.retryCondition(error)) {
					this.options.logger.debug?.(
						`[retry] ${operationName} failed with non-retryable error`
					);
					break;
				}

				const delay = this.calculateDelay(attempt);
				this.options.logger.warn(
					`[retry] ${operationName} failed on attempt ${attempt}, retrying in ${delay}ms`,
					{
						error:
							error instanceof Error
								? error.message
								: String(error),
					}
				);

				await this.sleep(delay);
			}
		}

		throw lastError;
	}

	private calculateDelay(attempt: number): number {
		return Math.round(
			this.options.delay *
				Math.pow(this.options.backoffMultiplier, attempt - 1)
		);
	}

	private sleep(ms: number): Promise<void> {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	private defaultRetryCondition(error: unknown): boolean {
		if (error instanceof Error) {
			const message = error.message.toLowerCase();

			// Retry on network errors
			if (
				message.includes('enotfound') ||
				message.includes('econnrefused') ||
				message.includes('timeout') ||
				message.includes('network') ||
				message.includes('502') ||
				message.includes('503') ||
				message.includes('504')
			) {
				return true;
			}

			// Don't retry on authentication/authorization errors
			if (
				message.includes('unauthorized') ||
				message.includes('forbidden') ||
				message.includes('invalid') ||
				message.includes('authentication')
			) {
				return false;
			}
		}

		return false;
	}

	private createNullLogger(): Logger {
		return {
			info: () => {},
			warn: () => {},
			error: () => {},
			debug: () => {},
		};
	}
}

// Convenience functions
export async function withRetry<T>(
	operation: () => Promise<T>,
	options: RetryOptions,
	operationName?: string
): Promise<T> {
	const retryable = new RetryableOperation(options);
	return retryable.execute(operation, operationName);
}

export const RetryPresets = {
	// Quick retry for fast operations
	quick: {
		maxAttempts: 3,
		delay: 500,
		backoffMultiplier: 1.5,
	},

	// Network operations that might be slow
	network: {
		maxAttempts: 5,
		delay: 1000,
		backoffMultiplier: 2,
	},

	// Build operations that might take time
	build: {
		maxAttempts: 2,
		delay: 2000,
		backoffMultiplier: 1,
	},
} as const;
