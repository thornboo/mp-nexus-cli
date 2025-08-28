# 配置参考

`mp-nexus.config.js` 文件是所有配置的单一入口点。如果您的工具链支持，也支持 TypeScript 配置文件。

## 快速开始

创建配置文件最简单的方法是使用交互式初始化命令：

```bash
nexus init
```

这将自动检测您的项目框架并引导您完成配置过程。

## 配置优先级

1. CLI 选项（`--mode --desc --ver --config --lang`）
2. 来自 `.env.<mode>` 的环境变量（例如，`.env.production`）
3. 来自 `.env` 的环境变量（包括 `NEXUS_LANG`）
4. `mp-nexus.config.js` 中的值
5. 默认值（语言：从系统自动检测）

## 配置模式

```typescript
export interface NexusConfig {
  // 项目框架类型（如果未指定则自动检测）
  projectType?: 'taro' | 'uni-app';
  
  // 界面语言（如果未指定则从系统自动检测）
  language?: 'en' | 'zh-CN';
  
  // 目标平台
  platform?: 'weapp' | 'alipay' | 'tt' | 'qq';
  
  // 小程序 App ID（必需）
  appId: string;
  
  // 私钥文件路径（必需）
  privateKeyPath: string;
  
  // 项目根路径（默认：'.'）
  projectPath?: string;
  
  // 构建输出目录（如果未指定则自动检测）
  outputDir?: string;
  
  // 传递给 miniprogram-ci 的额外选项
  ciOptions?: Record<string, unknown>;
  
  // 通知设置
  notify?: {
    webhook?: string;
    provider?: 'feishu' | 'dingtalk' | 'wechatwork' | 'custom';
    headers?: Record<string, string>;
  };
}
```

## 配置示例

### 基础配置
```javascript
// mp-nexus.config.js
module.exports = {
  projectType: 'taro',
  platform: 'weapp',
  appId: 'your_project_appid',
  privateKeyPath: './private.key',
  projectPath: '.',
  outputDir: 'dist/weapp',
  ciOptions: {}
};
```

### 基于环境的配置
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

### 多平台配置
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

### 完整配置示例（包含通知）
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

## 详细配置选项

### projectType
项目框架类型。如果未指定，CLI 将尝试自动检测：
- `'taro'`：Taro 框架项目
- `'uni-app'`：uni-app 框架项目

自动检测逻辑：
- 检查 `package.json` 中的依赖
- 检查特定的配置文件（例如，Taro 的 `config/index.js`）

### platform
目标小程序平台：
- `'weapp'`：微信小程序（默认）
- `'alipay'`：支付宝小程序
- `'tt'`：字节跳动小程序
- `'qq'`：QQ 小程序

### appId
小程序 App ID，这是必需的配置项。建议通过环境变量设置以避免硬编码。

### privateKeyPath
私钥文件路径。私钥用于调用平台 CI 接口进行上传和预览操作。

**安全注意事项**：
- 不要将私钥文件提交到版本控制系统
- 在 CI/CD 环境中，建议将私钥内容存储为机密并在运行时写入文件

### projectPath
项目根目录路径，默认为当前目录（`'.'`）。

### outputDir
构建输出目录。如果未指定，CLI 将根据框架类型和平台自动检测：
- Taro：`dist/{platform}`
- uni-app：`dist/build/mp-{platform}`

### ciOptions
传递给 miniprogram-ci 的额外选项。常见选项包括：

```javascript
ciOptions: {
  setting: {
    es6: true,              // 启用 ES6 到 ES5 转换
    minify: true,           // 启用代码压缩
    codeProtect: true,      // 启用代码保护
    minifyJS: true,         // 启用 JS 压缩
    minifyWXML: true,       // 启用 WXML 压缩
    minifyWXSS: true,       // 启用 WXSS 压缩
  },
  onProgressUpdate: (info) => {
    console.log('上传进度:', info);
  },
}
```

### notify
用于在部署完成后发送通知的通知配置。

支持的提供商：
- `'feishu'`：飞书机器人
- `'dingtalk'`：钉钉机器人
- `'wechatwork'`：企业微信机器人
- `'custom'`：自定义 webhook

## 环境变量支持

您可以在 `.env` 文件中设置环境变量：

```bash
# .env
MP_APP_ID=your_app_id
MP_PRIVATE_KEY_PATH=./private.key
NODE_ENV=development

# .env.production
MP_APP_ID=your_production_app_id
MP_PRIVATE_KEY_PATH=./private-prod.key
NODE_ENV=production
FEISHU_WEBHOOK=https://open.feishu.cn/open-apis/bot/v2/hook/xxx
```

## TypeScript 支持

如果您使用 TypeScript，可以创建 `mp-nexus.config.ts` 文件：

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

## 提示和最佳实践

### 安全性
- 不要将私钥文件提交到版本控制系统
- 使用环境变量存储敏感信息
- 在 CI/CD 环境中使用机密管理服务

### 项目检测
- 如果省略 `projectType`，CLI 将通过依赖和配置文件尝试自动检测
- 当自动检测失败时手动指定 `projectType`

### 输出目录
- 确保 `outputDir` 与框架构建输出目录匹配
- 不同框架和平台的默认输出目录可能不同

### 多环境管理
- 使用 `.env.<mode>` 文件管理不同环境配置
- 通过 `--mode` 参数切换环境

### 通知配置
- 在生产环境中配置通知以及时了解部署状态
- 测试期间使用 `mock://` 前缀避免发送真实通知
