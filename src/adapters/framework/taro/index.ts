import path from 'node:path';
import fs from 'node:fs/promises';
import { execa } from 'execa';
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

    options.logger.info('[taro] 开始构建...');
    
    try {
      // 检测taro CLI是否可用
      try {
        await execa('taro', ['--version'], { cwd: options.cwd });
      } catch {
        throw new Error('未检测到 Taro CLI，请先安装：npm install -g @tarojs/cli');
      }

      // 确定构建命令
      const buildCommand = 'build';
      const platform = 'weapp';
      const env = options.mode || 'development';
      
      const args = [buildCommand, '--type', platform, '--env', env];
      
      options.logger.debug(`[taro] 执行命令: taro ${args.join(' ')}`);
      
      const result = await execa('taro', args, {
        cwd: options.cwd,
        stdio: options.logger.debug ? 'inherit' : 'pipe',
        env: {
          ...process.env,
          ...options.env,
        },
      });

      if (result.exitCode !== 0) {
        throw new Error(`Taro构建失败 (exit code: ${result.exitCode})`);
      }

      options.logger.info('[taro] 构建完成');
    } catch (error) {
      options.logger.error('[taro] 构建失败', error);
      throw error;
    }
  }

  async getOutputPath(options: BuildOptions): Promise<string> {
    try {
      // 读取项目配置中的输出目录
      const configPath = path.resolve(options.cwd, 'config', 'index.js');
      const config = await import(configPath).catch(() => null);
      
      let outputDir = 'dist/weapp';
      if (config?.default?.outputRoot) {
        outputDir = config.default.outputRoot;
      } else if (config?.outputRoot) {
        outputDir = config.outputRoot;
      }
      
      const candidate = path.resolve(options.cwd, outputDir);
      options.logger.debug(`[taro] 产物目录: ${candidate}`);
      return candidate;
    } catch {
      // 回退到默认路径
      const candidate = path.resolve(options.cwd, 'dist', 'weapp');
      options.logger.debug(`[taro] 使用默认产物目录: ${candidate}`);
      return candidate;
    }
  }
}

export function createTaroAdapter(): FrameworkAdapter {
  return new TaroFrameworkAdapter();
}


