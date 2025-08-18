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
            
            // First generate terminal QR code for immediate display
            console.log('\n📱 预览二维码：\n');
            const terminalResult = await ci.preview({
                project,
                version: options.version || '1.0.0',
                desc: options.desc || '预览版本',
                qrcodeFormat: 'terminal',
                robot: 1,
                setting: {
                    es6: true,
                    minify: true,
                    codeProtect: true,
                    ...options.ciOptions?.setting,
                },
                ...options.ciOptions,
            });
            
            // Also generate image file for saving
            const imagePath = options.qrcodeOutputPath || path.resolve(options.projectPath, 'preview-qrcode.png');
            const imageResult = await ci.preview({
                project,
                version: options.version || '1.0.0',
                desc: options.desc || '预览版本',
                qrcodeFormat: 'image',
                qrcodeOutputDest: imagePath,
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
            console.log(`\n二维码已保存至: ${imagePath}\n`);
            
            return {
                success: true,
                qrcodeImagePath: imagePath,
                raw: { terminal: terminalResult, image: imageResult },
            };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : String(error);
            options.logger.error('[weapp] 预览失败', { error: errorMessage, stack: error instanceof Error ? error.stack : undefined });
            
            // Provide helpful error suggestions
            if (errorMessage.includes('appid')) {
                options.logger.error('[weapp] 提示: 请检查 appId 配置是否正确');
            } else if (errorMessage.includes('private') || errorMessage.includes('key')) {
                options.logger.error('[weapp] 提示: 请检查私钥文件路径和权限');
            } else if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
                options.logger.error('[weapp] 提示: 网络连接问题，请检查网络或稍后重试');
            }
            
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
            const errorMessage = error instanceof Error ? error.message : String(error);
            options.logger.error('[weapp] 上传失败', { error: errorMessage, stack: error instanceof Error ? error.stack : undefined });
            
            // Provide helpful error suggestions
            if (errorMessage.includes('appid')) {
                options.logger.error('[weapp] 提示: 请检查 appId 配置是否正确');
            } else if (errorMessage.includes('private') || errorMessage.includes('key')) {
                options.logger.error('[weapp] 提示: 请检查私钥文件路径和权限');
            } else if (errorMessage.includes('version')) {
                options.logger.error('[weapp] 提示: 版本号可能已存在或格式不正确');
            } else if (errorMessage.includes('network') || errorMessage.includes('timeout')) {
                options.logger.error('[weapp] 提示: 网络连接问题，请检查网络或稍后重试');
            }
            
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


