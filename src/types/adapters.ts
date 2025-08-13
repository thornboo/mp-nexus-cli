/**
 * Adapter-related types for mp-nexus-cli
 */

import type { Logger } from './index';

/** Supported platform names. */
export type PlatformName = 'weapp' | 'alipay' | 'bytedance' | string;

/** Build-time parameters passed to framework adapters. */
export interface BuildOptions {
    cwd: string;
    mode?: string;
    env?: Record<string, string>;
    logger: Logger;
}

/** Contract for framework adapters (Taro/uni-app/...). */
export interface FrameworkAdapter {
    /** Adapter name, e.g. `taro` or `uni-app`. */
    name: string;
    /** Return true if current `cwd` is supported by this adapter. */
    detect(cwd: string): Promise<boolean>;
    /** Run framework build and throw on failure. */
    build(options: BuildOptions): Promise<void>;
    /** Resolve the output path that should be uploaded to platform CI. */
    getOutputPath(options: BuildOptions): Promise<string>;
}

/** Shared options for CI preview/upload. */
export interface BaseCIOptions {
    projectPath: string;
    appId: string;
    privateKeyPath: string;
    version?: string;
    desc?: string;
    logger: Logger;
    qrcodeOutputPath?: string;
    ciOptions?: Record<string, unknown>;
}

/** Options for preview flow. */
export interface PreviewOptions extends BaseCIOptions {}

/** Options for upload flow. */
export interface UploadOptions extends BaseCIOptions {}

/** Result for preview flow. */
export interface PreviewResult {
    success: boolean;
    /** Local file path to generated QR image if available. */
    qrcodeImagePath?: string;
    /** Optional URL pointing to QR image (if platform provides). */
    qrcodeUrl?: string;
    /** Raw platform-specific payload for troubleshooting. */
    raw?: unknown;
}

/** Result for upload flow. */
export interface UploadResult {
    success: boolean;
    /** Version actually uploaded. */
    version?: string;
    /** Optional project page or portal URL from the platform. */
    projectUrl?: string;
    /** Raw platform-specific payload for troubleshooting. */
    raw?: unknown;
}

/** Contract for platform adapters (weapp/alipay/...). */
export interface PlatformAdapter {
    /** Platform name, e.g. `weapp`. */
    name: PlatformName;
    preview(options: PreviewOptions): Promise<PreviewResult>;
    upload(options: UploadOptions): Promise<UploadResult>;
}


