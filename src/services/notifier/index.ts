import type { Notifier, NotifierConfig, NotifierMessage } from '../../types/notifier';

/**
 * Minimal HTTP sender so we do not pull in extra deps at this stage.
 * In real implementation, prefer `undici` or `node-fetch` and add retries/timeouts.
 */
async function postJson(url: string, body: unknown, headers?: Record<string, string>): Promise<Response> {
    // @ts-ignore - global fetch available in Node >=18; polyfill otherwise.
    return fetch(url, {
        method: 'POST',
        headers: { 'content-type': 'application/json', ...(headers || {}) },
        body: JSON.stringify(body)
    });
}

/** A very small mock-friendly notifier implementation. */
export class SimpleWebhookNotifier implements Notifier {
    provider: Notifier['provider'];

    constructor(provider: Notifier['provider'] = 'custom') {
        this.provider = provider;
    }

    async notify(message: NotifierMessage, config: NotifierConfig): Promise<void> {
        const payload = this.transform(message, config);
        // For tests we allow WEBHOOK value like "mock://..." to skip actual network calls.
        if (config.webhook.startsWith('mock://')) {
            return; // no-op for integration tests
        }
        const res = await postJson(config.webhook, payload, config.headers);
        if (!res.ok) {
            const text = await res.text().catch(() => '');
            throw new Error(`Notifier request failed: ${res.status} ${res.statusText} ${text}`);
        }
    }

    /** Map generic NotifierMessage to provider-specific payload (very simple for now). */
    protected transform(message: NotifierMessage, config: NotifierConfig): unknown {
        switch (config.provider) {
            case 'feishu':
                return {
                    msg_type: 'text',
                    content: { text: this.composeText(message) }
                };
            case 'dingtalk':
                return {
                    msgtype: 'text',
                    text: { content: this.composeText(message) }
                };
            case 'wechatwork':
                return {
                    msgtype: 'text',
                    text: { content: this.composeText(message) }
                };
            default:
                return message; // raw pass-through for custom
        }
    }

    private composeText(message: NotifierMessage): string {
        const parts = [message.title, message.text, message.markdown].filter(Boolean);
        return String(parts.join('\n')).trim();
    }
}

export function createNotifier(provider: Notifier['provider'] = 'custom'): Notifier {
    return new SimpleWebhookNotifier(provider);
}


