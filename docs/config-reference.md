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
  
  // Notification settings
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

### Complete Configuration Example (with Notifications)
```javascript
// mp-nexus.config.js
module.exports = {
  projectType: 'taro',
  platform: 'weapp',
  appId: process.env.MP_APP_ID,
  privateKeyPath: './private.key',
  projectPath: '.',
  outputDir: 'dist/weapp',
  ciOptions: {
    setting: {
      es6: true,
      minify: true,
      codeProtect: true,
      minifyJS: true,
      minifyWXML: true,
      minifyWXSS: true,
    },
    onProgressUpdate: console.log,
  },
  notify: {
    webhook: process.env.FEISHU_WEBHOOK,
    provider: 'feishu',
    headers: {
      'Content-Type': 'application/json',
    },
  },
};
```

## Detailed Configuration Options

### projectType
Project framework type. If not specified, CLI will attempt auto-detection:
- `'taro'`: Taro framework project
- `'uni-app'`: uni-app framework project

Auto-detection logic:
- Check dependencies in `package.json`
- Check for specific configuration files (e.g., `config/index.js` for Taro)

### platform
Target mini-program platform:
- `'weapp'`: WeChat Mini Program (default)
- `'alipay'`: Alipay Mini Program
- `'tt'`: ByteDance Mini Program
- `'qq'`: QQ Mini Program

### appId
Mini program App ID, this is a required configuration item. It's recommended to set via environment variables to avoid hardcoding.

### privateKeyPath
Path to the private key file. The private key is used to call platform CI interfaces for upload and preview operations.

**Security Notes**:
- Do not commit private key files to version control systems
- In CI/CD environments, it's recommended to store private key content as secrets and write to file at runtime

### projectPath
Project root directory path, defaults to current directory (`'.'`).

### outputDir
Build output directory. If not specified, CLI will auto-detect based on framework type and platform:
- Taro: `dist/{platform}`
- uni-app: `dist/build/mp-{platform}`

### ciOptions
Additional options passed to miniprogram-ci. Common options include:

```javascript
ciOptions: {
  setting: {
    es6: true,              // Enable ES6 to ES5 transformation
    minify: true,           // Enable code minification
    codeProtect: true,      // Enable code protection
    minifyJS: true,         // Enable JS minification
    minifyWXML: true,       // Enable WXML minification
    minifyWXSS: true,       // Enable WXSS minification
  },
  onProgressUpdate: (info) => {
    console.log('Upload progress:', info);
  },
}
```

### notify
Notification configuration for sending notifications after deployment completion.

Supported providers:
- `'feishu'`: Feishu Bot
- `'dingtalk'`: DingTalk Bot
- `'wechatwork'`: WeChatWork Bot
- `'custom'`: Custom webhook

## Environment Variable Support

You can set environment variables in `.env` files:

```bash
# .env
MP_APP_ID=wx1234567890abcdef
MP_PRIVATE_KEY_PATH=./private.key
NODE_ENV=development

# .env.production
MP_APP_ID=wx9876543210fedcba
MP_PRIVATE_KEY_PATH=./private-prod.key
NODE_ENV=production
FEISHU_WEBHOOK=https://open.feishu.cn/open-apis/bot/v2/hook/xxx
```

## TypeScript Support

If you're using TypeScript, you can create a `mp-nexus.config.ts` file:

```typescript
import { defineConfig } from 'mp-nexus-cli';

export default defineConfig({
  projectType: 'taro',
  platform: 'weapp',
  appId: process.env.MP_APP_ID!,
  privateKeyPath: './private.key',
  ciOptions: {
    setting: {
      es6: true,
      minify: true,
    },
  },
});
```

## Tips and Best Practices

### Security
- Do not commit private key files to version control systems
- Use environment variables to store sensitive information
- Use secret management services in CI/CD environments

### Project Detection
- If you omit `projectType`, CLI will attempt auto-detection via dependencies and configuration files
- Manually specify `projectType` when auto-detection fails

### Output Directory
- Ensure `outputDir` matches framework build output directory
- Default output directories may vary between different frameworks and platforms

### Multi-environment Management
- Use `.env.<mode>` files to manage different environment configurations
- Switch environments via `--mode` parameter

### Notification Configuration
- Configure notifications in production environments to stay informed about deployment status
- Use `mock://` prefix during testing to avoid sending real notifications
