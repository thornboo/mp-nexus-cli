import path from 'node:path';
import fs from 'node:fs/promises';
import * as ci from 'miniprogram-ci';
import type { PlatformAdapter, PreviewOptions, PreviewResult, UploadOptions, UploadResult } from '../../../types/adapters';

export class WeappPlatformAdapter implements PlatformAdapter {
    name = 'weapp';

    private async ensurePrivateKey(privateKeyPath: string): Promise<void> {
        try {
            await fs.access(privateKeyPath);
        } catch {
            throw new Error(`私钥文件不存在: ${privateKeyPath}`);
        }
    }

    async preview(options: PreviewOptions): Promise<PreviewResult> {
        await this.ensurePrivateKey(options.privateKeyPath);

        const project = new ci.Project({
            appid: options.appId,
            type: 'miniProgram',
            projectPath: options.projectPath,
            privateKeyPath: options.privateKeyPath,
            ignores: ['node_modules/**/*'],
        });

        try {
            options.logger.info('[weapp] 开始生成预览二维码...');
            
            const previewResult = await ci.preview({
                project,
                version: options.version || '1.0.0',
                desc: options.desc || '预览版本',
                qrcodeFormat: 'image',
                qrcodeOutputDest: options.qrcodeOutputPath || path.resolve(options.projectPath, 'preview-qrcode.png'),
                robot: 1,
                setting: {
                    es6: true,
                    minify: true,
                    codeProtect: true,
                    ...options.ciOptions?.setting,
                },
                ...options.ciOptions,
            });

            options.logger.info('[weapp] 预览二维码已生成');
            
            return {
                success: true,
                qrcodeImagePath: previewResult.qrcodeFilePath,
                raw: previewResult,
            };
        } catch (error) {
            options.logger.error('[weapp] 预览失败', error);
            return {
                success: false,
                raw: error,
            };
        }
    }

    async upload(options: UploadOptions): Promise<UploadResult> {
        await this.ensurePrivateKey(options.privateKeyPath);

        const project = new ci.Project({
            appid: options.appId,
            type: 'miniProgram',
            projectPath: options.projectPath,
            privateKeyPath: options.privateKeyPath,
            ignores: ['node_modules/**/*'],
        });

        try {
            options.logger.info('[weapp] 开始上传代码...');
            
            const uploadResult = await ci.upload({
                project,
                version: options.version || '1.0.0',
                desc: options.desc || '上传版本',
                robot: 1,
                setting: {
                    es6: true,
                    minify: true,
                    codeProtect: true,
                    ...options.ciOptions?.setting,
                },
                ...options.ciOptions,
            });

            options.logger.info('[weapp] 上传完成', {
                version: uploadResult.version,
                subPackageInfo: uploadResult.subPackageInfo,
            });

            return {
                success: true,
                version: uploadResult.version,
                raw: uploadResult,
            };
        } catch (error) {
            options.logger.error('[weapp] 上传失败', error);
            return {
                success: false,
                raw: error,
            };
        }
    }
}

export function createWeappAdapter(): PlatformAdapter {
    return new WeappPlatformAdapter();
}


