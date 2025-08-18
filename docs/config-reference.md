# Configuration Reference

The `mp-nexus.config.js` file is the single entry point for all configuration. TypeScript configuration files are also supported if your toolchain allows.

## Quick Start

The easiest way to create a configuration file is using the interactive init command:

```bash
nexus init
```

This will auto-detect your project framework and guide you through the configuration process.

## Configuration Priority

1. CLI options (`--mode --desc --ver --config`)
2. Environment variables from `.env.<mode>` (e.g., `.env.production`)
3. Environment variables from `.env`
4. Values in `mp-nexus.config.js`
5. Default values

## Configuration Schema

```typescript
export interface NexusConfig {
  // Project framework type (auto-detected if not specified)
  projectType?: 'taro' | 'uni-app';
  
  // Target platform
  platform?: 'weapp' | 'alipay' | 'tt' | 'qq';
  
  // Mini program App ID (required)
  appId: string;
  
  // Path to private key file (required)
  privateKeyPath: string;
  
  // Project root path (default: '.')
  projectPath?: string;
  
  // Build output directory (auto-detected if not specified)
  outputDir?: string;
  
  // Additional options passed to miniprogram-ci
  ciOptions?: Record<string, unknown>;
  
  // Notification settings (future feature)
  notify?: {
    webhook?: string;
    provider?: 'feishu' | 'dingtalk' | 'wechatwork' | 'custom';
    headers?: Record<string, string>;
  };
}
```

## Configuration Examples

### Basic Configuration
```javascript
// mp-nexus.config.js
module.exports = {
  projectType: 'taro',
  platform: 'weapp',
  appId: 'wx1234567890abcdef',
  privateKeyPath: './private.key',
  projectPath: '.',
  outputDir: 'dist/weapp',
  ciOptions: {}
};
```

### Environment-based Configuration
```javascript
// mp-nexus.config.js
module.exports = {
  projectType: 'taro',
  platform: 'weapp',
  appId: process.env.MP_APP_ID,
  privateKeyPath: process.env.MP_PRIVATE_KEY_PATH || './private.key',
  projectPath: '.',
  outputDir: 'dist/weapp',
  ciOptions: {
    setting: {
      es6: true,
      minify: true,
      codeProtect: true,
    },
  },
};
```

### Multi-platform Configuration
```javascript
// mp-nexus.config.js
const platform = process.env.TARGET_PLATFORM || 'weapp';

module.exports = {
  projectType: 'uni-app',
  platform,
  appId: process.env[`MP_APP_ID_${platform.toUpperCase()}`],
  privateKeyPath: `./keys/private-${platform}.key`,
  outputDir: `dist/build/mp-${platform === 'weapp' ? 'weixin' : platform}`,
  ciOptions: {
    setting: {
      es6: platform === 'weapp',
      minify: true,
    },
  },
};
```

## 提示

- 不要提交私钥到仓库。请使用 CI 密钥，并在工作流执行时写入。
- 若省略 `projectType`，CLI 会尝试通过依赖和配置文件进行自动检测。
- 确保 `outputDir` 与框架构建产物目录一致，满足平台 CI 的输入要求。


