/**
 * Enhanced structured logger for mp-nexus-cli
 */

import type { Logger } from '../types';

export interface LogContext {
	stage?: string;
	component?: string;
	traceId?: string;
	[key: string]: unknown;
}

export class StructuredLogger implements Logger {
	private verbose: boolean;
	private context: LogContext;

	constructor(verbose = false, context: LogContext = {}) {
		this.verbose = verbose;
		this.context = context;
	}

	private formatMessage(
		level: string,
		message: string,
		data?: unknown
	): string {
		const timestamp = new Date().toISOString();
		const contextStr =
			Object.keys(this.context).length > 0
				? ` [${Object.entries(this.context)
						.map(([k, v]) => `${k}=${v}`)
						.join(',')}]`
				: '';

		if (data && typeof data === 'object') {
			return `${timestamp} [${level}]${contextStr} ${message} ${JSON.stringify(
				data
			)}`;
		}

		return `${timestamp} [${level}]${contextStr} ${message}${
			data ? ` ${String(data)}` : ''
		}`;
	}

	private logToConsole(
		level: 'info' | 'warn' | 'error' | 'debug',
		message: string,
		data?: unknown
	) {
		const formatted = this.formatMessage(level, message, data);

		switch (level) {
			case 'info':
				console.log(`[info] ${message}`, data || '');
				break;
			case 'warn':
				console.warn(`[warn] ${message}`, data || '');
				break;
			case 'error':
				console.error(`[error] ${message}`, data || '');
				break;
			case 'debug':
				if (this.verbose) {
					console.log(`[debug] ${message}`, data || '');
				}
				break;
		}
	}

	info(message: string, data?: unknown): void {
		this.logToConsole('info', message, data);
	}

	warn(message: string, data?: unknown): void {
		this.logToConsole('warn', message, data);
	}

	error(message: string, data?: unknown): void {
		this.logToConsole('error', message, data);
	}

	debug(message: string, data?: unknown): void {
		if (this.verbose) {
			this.logToConsole('debug', message, data);
		}
	}

	child(bindings: Record<string, unknown>): Logger {
		return new StructuredLogger(this.verbose, {
			...this.context,
			...bindings,
		});
	}

	// Create contextual loggers for different components
	static createComponentLogger(component: string, verbose = false): Logger {
		return new StructuredLogger(verbose, { component });
	}

	static createStageLogger(stage: string, verbose = false): Logger {
		return new StructuredLogger(verbose, { stage });
	}
}

// Factory function for creating loggers
export function createLogger(
	verbose = false,
	context: LogContext = {}
): Logger {
	return new StructuredLogger(verbose, context);
}

// Predefined component loggers
export const LoggerFactory = {
	cli: (verbose = false) =>
		StructuredLogger.createComponentLogger('cli', verbose),
	orchestrator: (verbose = false) =>
		StructuredLogger.createComponentLogger('orchestrator', verbose),
	taro: (verbose = false) =>
		StructuredLogger.createComponentLogger('taro', verbose),
	uniApp: (verbose = false) =>
		StructuredLogger.createComponentLogger('uni-app', verbose),
	weapp: (verbose = false) =>
		StructuredLogger.createComponentLogger('weapp', verbose),
	config: (verbose = false) =>
		StructuredLogger.createComponentLogger('config', verbose),
};
