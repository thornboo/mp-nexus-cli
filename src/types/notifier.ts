/**
 * Notifier-related types for mp-nexus-cli
 */

/** Notifier providers supported by the built-in notifier implementation. */
export type NotifierProvider = 'feishu' | 'dingtalk' | 'wechatwork' | 'custom';

/** Notifier message model. */
export interface NotifierMessage {
    title?: string;
    text?: string;
    markdown?: string;
    level?: 'info' | 'warning' | 'error' | 'success';
    attachments?: Array<{ filename: string; path: string }>;
    meta?: Record<string, unknown>;
}

/** Notifier configuration model. */
export interface NotifierConfig {
    provider: NotifierProvider;
    webhook: string;
    headers?: Record<string, string>;
}

/** Contract for result notifiers (Feishu/DingTalk/WeCom/...). */
export interface Notifier {
    provider: NotifierProvider;
    notify(message: NotifierMessage, config: NotifierConfig): Promise<void>;
}


