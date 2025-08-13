import type { PlatformAdapter, PreviewOptions, PreviewResult, UploadOptions, UploadResult } from '../../../types/adapters';

/**
 * Minimal weapp platform adapter (mock-first).
 * Real implementation should wrap `miniprogram-ci` preview/upload calls.
 */
export class WeappPlatformAdapter implements PlatformAdapter {
    name = 'weapp';

    async preview(options: PreviewOptions): Promise<PreviewResult> {
        // Mock: return a fake qrcode path for integration tests
        options.logger.info('[weapp] preview mock', options.projectPath);
        return {
            success: true,
            qrcodeImagePath: options.qrcodeOutputPath || 'mock://qrcode.png',
            raw: { mock: true }
        };
    }

    async upload(options: UploadOptions): Promise<UploadResult> {
        // Mock: return a fake version
        options.logger.info('[weapp] upload mock', options.projectPath);
        return {
            success: true,
            version: options.version || '0.0.0-mock',
            projectUrl: 'mock://weapp-project',
            raw: { mock: true }
        };
    }
}

export function createWeappAdapter(): PlatformAdapter {
    return new WeappPlatformAdapter();
}


