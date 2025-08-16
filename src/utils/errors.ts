import { ExitCodes, type ExitCode } from './exit-codes';

export class NexusError extends Error {
  public readonly code: ExitCode;
  public readonly details?: Record<string, unknown>;

  constructor(message: string, code: ExitCode, details?: Record<string, unknown>) {
    super(message);
    this.name = 'NexusError';
    this.code = code;
    this.details = details;
  }
}

export function createError(message: string, code: ExitCode, details?: Record<string, unknown>): NexusError {
  return new NexusError(message, code, details);
}

export function handleError(error: unknown, logger?: { error: (msg: string, ...args: unknown[]) => void }): ExitCode {
  if (error instanceof NexusError) {
    logger?.error(`[错误] ${error.message}`, error.details || {});
    return error.code;
  }
  
  if (error instanceof Error) {
    logger?.error(`[错误] ${error.message}`);
    return ExitCodes.ERROR_UNKNOWN;
  }
  
  logger?.error(`[错误] ${String(error)}`);
  return ExitCodes.ERROR_UNKNOWN;
}

// 预定义错误工厂
export const Errors = {
  configNotFound: (path: string) => createError(
    `配置文件未找到: ${path}`,
    ExitCodes.ERROR_CONFIG_NOT_FOUND,
    { path }
  ),
  
  fileNotFound: (path: string) => createError(
    `文件未找到: ${path}`,
    ExitCodes.ERROR_FILE_NOT_FOUND,
    { path }
  ),
  
  buildFailed: (framework: string, details?: unknown) => createError(
    `${framework} 构建失败`,
    ExitCodes.ERROR_BUILD_FAILED,
    { framework, details }
  ),
  
  deployFailed: (platform: string, details?: unknown) => createError(
    `${platform} 部署失败`,
    ExitCodes.ERROR_DEPLOY_FAILED,
    { platform, details }
  ),
  
  invalidAppId: (appId: string) => createError(
    `无效的 AppID: ${appId}`,
    ExitCodes.ERROR_WEAPP_INVALID_APPID,
    { appId }
  ),
  
  invalidPrivateKey: (path: string) => createError(
    `无效的私钥文件: ${path}`,
    ExitCodes.ERROR_WEAPP_INVALID_PRIVATE_KEY,
    { path }
  ),
};