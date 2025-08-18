# Adapters Guide

mp-nexus-cli uses a plugin architecture with adapter patterns to support different frameworks and platforms. This guide will help you understand how to develop and extend adapters.

## Architecture Overview

Adapters are divided into two categories:
- **Framework Adapters**: Handle detection and building of different frontend framework projects (e.g., Taro, uni-app)
- **Platform Adapters**: Handle interaction with different mini-program platform CI services (e.g., WeChat, Alipay)

## Framework Adapters

Framework adapters handle the build logic for specific frontend frameworks.

### Interface Definition

```typescript
export interface FrameworkAdapter {
  name: string;
  detect(cwd: string): Promise<boolean>;
  build(options: BuildOptions): Promise<void>;
  getOutputPath(options: BuildOptions): Promise<string>;
}

export interface BuildOptions {
  cwd: string;
  mode?: string; // dev/test/prod
  env?: Record<string, string>;
  logger: Logger;
  platform?: string; // weapp/alipay/tt/qq
}
```

### Method Descriptions

#### `detect(cwd: string): Promise<boolean>`
Detect if the current project uses this framework.

**Parameters**:
- `cwd`: Project root directory path

**Returns**:
- `true`: Supports this project
- `false`: Does not support this project

**Implementation Example**:
```typescript
async detect(cwd: string): Promise<boolean> {
  const packageJsonPath = path.join(cwd, 'package.json');
  
  if (!await fs.pathExists(packageJsonPath)) {
    return false;
  }
  
  const packageJson = await fs.readJson(packageJsonPath);
  const dependencies = {
    ...packageJson.dependencies,
    ...packageJson.devDependencies,
  };
  
  // Check for Taro-related dependencies
  return !!(dependencies['@tarojs/cli'] || dependencies['@tarojs/taro']);
}
```

#### `build(options: BuildOptions): Promise<void>`
Execute framework build command.

**Parameters**:
- `options.cwd`: Project root directory
- `options.mode`: Build mode (development/production)
- `options.env`: Environment variables
- `options.logger`: Logger instance
- `options.platform`: Target platform

**Implementation Example**:
```typescript
async build(options: BuildOptions): Promise<void> {
  const { cwd, mode, env, logger, platform = 'weapp' } = options;
  
  // Build Taro command
  const args = ['build', '--type', platform];
  
  if (mode === 'production') {
    args.push('--prod');
  }
  
  logger.info(`Executing build command: taro ${args.join(' ')}`);
  
  try {
    await execa('taro', args, {
      cwd,
      env: { ...process.env, ...env },
      stdio: 'inherit',
    });
    
    logger.info('Build completed');
  } catch (error) {
    logger.error('Build failed:', error.message);
    throw new BuildError(`Taro build failed: ${error.message}`);
  }
}
```

#### `getOutputPath(options: BuildOptions): Promise<string>`
Get the build output directory.

**Parameters**:
- `options`: Build options

**Returns**:
- Absolute path to build output

**Implementation Example**:
```typescript
async getOutputPath(options: BuildOptions): Promise<string> {
  const { cwd, platform = 'weapp' } = options;
  
  // Try to read Taro configuration file
  const configPath = path.join(cwd, 'config', 'index.js');
  
  if (await fs.pathExists(configPath)) {
    // Parse configuration file to get output directory
    const config = require(configPath);
    const outputRoot = config.outputRoot || 'dist';
    return path.join(cwd, outputRoot, platform);
  }
  
  // Use default output directory
  return path.join(cwd, 'dist', platform);
}
```

### Complete Example: Taro Adapter

```typescript
import path from 'path';
import fs from 'fs-extra';
import { execa } from 'execa';
import type { FrameworkAdapter, BuildOptions } from '../types';
import { BuildError } from '../utils/errors';

export class TaroAdapter implements FrameworkAdapter {
  name = 'taro';

  async detect(cwd: string): Promise<boolean> {
    const packageJsonPath = path.join(cwd, 'package.json');
    
    if (!await fs.pathExists(packageJsonPath)) {
      return false;
    }
    
    const packageJson = await fs.readJson(packageJsonPath);
    const dependencies = {
      ...packageJson.dependencies,
      ...packageJson.devDependencies,
    };
    
    return !!(dependencies['@tarojs/cli'] || dependencies['@tarojs/taro']);
  }

  async build(options: BuildOptions): Promise<void> {
    const { cwd, mode, env, logger, platform = 'weapp' } = options;
    
    const args = ['build', '--type', platform];
    
    if (mode === 'production') {
      args.push('--prod');
    }
    
    logger.info(`Executing Taro build: ${args.join(' ')}`);
    
    try {
      await execa('npx', ['taro', ...args], {
        cwd,
        env: { ...process.env, ...env },
        stdio: 'inherit',
      });
      
      logger.info('Taro build completed');
    } catch (error) {
      throw new BuildError(`Taro build failed: ${error.message}`);
    }
  }

  async getOutputPath(options: BuildOptions): Promise<string> {
    const { cwd, platform = 'weapp' } = options;
    
    // Try to read configuration file
    const configPath = path.join(cwd, 'config', 'index.js');
    
    if (await fs.pathExists(configPath)) {
      try {
        const config = require(configPath);
        const outputRoot = config.outputRoot || 'dist';
        return path.join(cwd, outputRoot, platform);
      } catch (error) {
        // Configuration file read failed, use default path
      }
    }
    
    return path.join(cwd, 'dist', platform);
  }
}
```

## Platform Adapters

Platform adapters handle interaction with mini-program platform CI services.

### Interface Definition

```typescript
export interface PlatformAdapter {
  name: string;
  preview(options: PreviewOptions): Promise<PreviewResult>;
  upload(options: UploadOptions): Promise<UploadResult>;
}

export interface PreviewOptions {
  projectPath: string;
  appId: string;
  privateKeyPath: string;
  version?: string;
  desc?: string;
  qrcodeOutput?: string;
  logger: Logger;
  ciOptions?: Record<string, unknown>;
}

export interface UploadOptions extends PreviewOptions {}

export interface PreviewResult {
  success: boolean;
  qrcodeImagePath?: string;
  qrcodeUrl?: string;
  raw?: unknown;
}

export interface UploadResult {
  success: boolean;
  version?: string;
  projectUrl?: string;
  raw?: unknown;
}
```

### Method Descriptions

#### `preview(options: PreviewOptions): Promise<PreviewResult>`
Generate preview QR code.

#### `upload(options: UploadOptions): Promise<UploadResult>`
Upload mini-program version.

### Complete Example: WeChat Mini Program Adapter

```typescript
import ci from 'miniprogram-ci';
import type { PlatformAdapter, PreviewOptions, UploadOptions } from '../types';

export class WeappAdapter implements PlatformAdapter {
  name = 'weapp';

  async preview(options: PreviewOptions): Promise<PreviewResult> {
    const {
      projectPath,
      appId,
      privateKeyPath,
      version = '1.0.0',
      desc = 'Preview version',
      qrcodeOutput,
      logger,
      ciOptions = {},
    } = options;

    try {
      const project = new ci.Project({
        appid: appId,
        type: 'miniProgram',
        projectPath,
        privateKeyPath,
        ignores: ['node_modules/**/*'],
        ...ciOptions,
      });

      logger.info('Starting preview generation...');

      const previewResult = await ci.preview({
        project,
        version,
        desc,
        setting: {
          es6: true,
          minify: true,
          ...ciOptions.setting,
        },
        qrcodeFormat: 'image',
        qrcodeOutputDest: qrcodeOutput,
        onProgressUpdate: (info) => {
          logger.debug('Preview progress:', info);
        },
        ...ciOptions,
      });

      logger.info('Preview generation successful');

      return {
        success: true,
        qrcodeImagePath: qrcodeOutput,
        raw: previewResult,
      };
    } catch (error) {
      logger.error('Preview generation failed:', error);
      return {
        success: false,
        raw: error,
      };
    }
  }

  async upload(options: UploadOptions): Promise<UploadResult> {
    const {
      projectPath,
      appId,
      privateKeyPath,
      version = '1.0.0',
      desc = 'Release version',
      logger,
      ciOptions = {},
    } = options;

    try {
      const project = new ci.Project({
        appid: appId,
        type: 'miniProgram',
        projectPath,
        privateKeyPath,
        ignores: ['node_modules/**/*'],
        ...ciOptions,
      });

      logger.info('Starting version upload...');

      const uploadResult = await ci.upload({
        project,
        version,
        desc,
        setting: {
          es6: true,
          minify: true,
          ...ciOptions.setting,
        },
        onProgressUpdate: (info) => {
          logger.debug('Upload progress:', info);
        },
        ...ciOptions,
      });

      logger.info('Version upload successful');

      return {
        success: true,
        version,
        raw: uploadResult,
      };
    } catch (error) {
      logger.error('Version upload failed:', error);
      return {
        success: false,
        raw: error,
      };
    }
  }
}
```

## Adapter Registration

### Framework Adapter Registration

```typescript
// src/adapters/framework/index.ts
import { TaroAdapter } from './taro';
import { UniAdapter } from './uni';

export const frameworkAdapters = [
  new TaroAdapter(),
  new UniAdapter(),
];

export function getFrameworkAdapter(name: string) {
  return frameworkAdapters.find(adapter => adapter.name === name);
}

export async function detectFramework(cwd: string) {
  for (const adapter of frameworkAdapters) {
    if (await adapter.detect(cwd)) {
      return adapter;
    }
  }
  return null;
}
```

### Platform Adapter Registration

```typescript
// src/adapters/platform/index.ts
import { WeappAdapter } from './weapp';
import { AlipayAdapter } from './alipay';

export const platformAdapters = [
  new WeappAdapter(),
  new AlipayAdapter(),
];

export function getPlatformAdapter(name: string) {
  return platformAdapters.find(adapter => adapter.name === name);
}
```

## Development Best Practices

### Error Handling
- Use custom error types to distinguish different types of errors
- Provide detailed error messages and solution suggestions
- Log detailed debug information

### Cross-platform Compatibility
- Use `path` module for path handling
- Use `execa` for subprocess execution
- Handle differences between operating systems

### Logging
- Use the provided logger for logging
- Distinguish different log levels (info, warn, error, debug)
- Log progress information at key steps

### Configuration Handling
- Support platform-specific configuration via ciOptions
- Provide reasonable defaults
- Validate required configuration items

### Testing
- Write unit tests for each method
- Use mocks to avoid real network requests
- Test error scenarios and edge cases

## Extending New Adapters

### Adding New Framework Adapters

1. Create new file in `src/adapters/framework/` directory
2. Implement `FrameworkAdapter` interface
3. Register adapter in `index.ts`
4. Write test cases
5. Update documentation

### Adding New Platform Adapters

1. Create new file in `src/adapters/platform/` directory
2. Implement `PlatformAdapter` interface
3. Register adapter in `index.ts`
4. Write test cases
5. Update documentation

## Mock Adapters

During development and testing, you can use Mock adapters:

```typescript
export class MockWeappAdapter implements PlatformAdapter {
  name = 'weapp';

  async preview(options: PreviewOptions): Promise<PreviewResult> {
    const { logger, qrcodeOutput } = options;
    
    logger.info('[MOCK] Generating preview QR code');
    
    // Simulate async operation
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return {
      success: true,
      qrcodeImagePath: qrcodeOutput || './mock-qrcode.png',
    };
  }

  async upload(options: UploadOptions): Promise<UploadResult> {
    const { logger, version } = options;
    
    logger.info('[MOCK] Uploading version');
    
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    return {
      success: true,
      version: version || '1.0.0',
    };
  }
}
```

## Contributing

If you develop new adapters, welcome to submit Pull Requests:

1. Fork the project repository
2. Create feature branch
3. Implement adapter code
4. Write test cases
5. Update documentation
6. Submit Pull Request

We welcome community contributions of more framework and platform adapters!