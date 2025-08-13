# 配置参考（草稿）

`mp-nexus.config.js` 是所有配置的唯一入口。若工具链支持，也可使用 TS 编写。

## 优先级

1. CLI 选项（`--mode --desc --ver --config`）
2. `.env.<mode>`（例如 `.env.production`）
3. `.env`
4. `mp-nexus.config.js` 中的默认值

## 模型（Schema）

```ts
export interface NexusConfig {
  projectType?: 'taro' | 'uni-app';
  platform?: 'weapp' | 'alipay' | string;
  appId: string;
  privateKeyPath: string;
  projectPath?: string; // 默认 '.'
  outputDir?: string;   // 例如 'dist/weapp'
  ciOptions?: Record<string, unknown>;
  notify?: {
    webhook?: string;
    provider?: 'feishu' | 'dingtalk' | 'wechatwork' | 'custom';
    headers?: Record<string, string>;
  };
}
```

## 示例

```js
module.exports = {
  projectType: 'taro',
  platform: 'weapp',
  appId: process.env.MP_APP_ID,
  privateKeyPath: './private.key',
  projectPath: '.',
  outputDir: 'dist/weapp',
  ciOptions: {},
  notify: {
    provider: 'feishu',
    webhook: process.env.FEISHU_WEBHOOK
  }
}
```

## 提示

- 不要提交私钥到仓库。请使用 CI 密钥，并在工作流执行时写入。
- 若省略 `projectType`，CLI 会尝试通过依赖和配置文件进行自动检测。
- 确保 `outputDir` 与框架构建产物目录一致，满足平台 CI 的输入要求。


