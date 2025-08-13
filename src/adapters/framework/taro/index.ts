import path from 'node:path';
import fs from 'node:fs/promises';
import type { BuildOptions, FrameworkAdapter } from '../../../types/adapters';

async function readJsonSafe(filePath: string): Promise<any | undefined> {
  try {
    const buf = await fs.readFile(filePath, 'utf-8');
    return JSON.parse(buf);
  } catch {
    return undefined;
  }
}

export class TaroFrameworkAdapter implements FrameworkAdapter {
  name = 'taro';

  async detect(cwd: string): Promise<boolean> {
    const pkg = await readJsonSafe(path.resolve(cwd, 'package.json'));
    const deps = {
      ...(pkg?.dependencies || {}),
      ...(pkg?.devDependencies || {}),
    } as Record<string, string>;
    return Boolean(
      deps['@tarojs/taro'] || deps['@tarojs/cli'] || deps['taro']
    );
  }

  async build(options: BuildOptions): Promise<void> {
    const skip = options.env?.NEXUS_SKIP_BUILD === '1';
    if (skip) {
      options.logger.info('[taro] 跳过构建（NEXUS_SKIP_BUILD=1）');
      return;
    }
    // 最小实现：提示用户手动构建，后续接入 taro CLI 调用。
    options.logger.warn('[taro] 当前未内置触发 taro 构建，请先在项目中执行构建命令');
  }

  async getOutputPath(options: BuildOptions): Promise<string> {
    // 常见默认产物目录：dist/weapp
    const candidate = path.resolve(options.cwd, 'dist', 'weapp');
    return candidate;
  }
}

export function createTaroAdapter(): FrameworkAdapter {
  return new TaroFrameworkAdapter();
}


