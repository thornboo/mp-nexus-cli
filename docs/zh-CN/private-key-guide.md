# 微信小程序私钥获取指南

本指南详细说明如何获取和配置 mp-nexus-cli 所需的微信小程序私钥文件。

## 什么是私钥文件？

`private.key` 文件是微信小程序平台生成的安全凭证，用于：
- 上传代码到微信小程序后台
- 生成预览二维码
- 自动发布版本
- 调用微信小程序 CI 接口

## 🔍 如何获取私钥

### 第1步：登录微信小程序管理后台
1. 访问 https://mp.weixin.qq.com
2. 使用小程序管理员账号登录

### 第2步：进入开发设置页面
1. 点击左侧菜单「开发」→「开发管理」
2. 选择「开发设置」标签页

### 第3步：下载代码上传密钥
1. 滚动到「代码上传密钥」部分
2. 如果没有密钥，先点击「生成」按钮
3. 点击「下载密钥」保存文件
4. 将下载的文件重命名为 `private.key`
5. 将密钥文件放到项目根目录

## 📁 推荐的文件组织方式

### 基础设置
```
your-project/
├── mp-nexus.config.js
├── private.key              # 开发环境密钥
├── .env
└── .gitignore              # 重要：排除 private.key
```

### 多环境设置（推荐）
```
your-project/
├── mp-nexus.config.js
├── keys/                    # 专门的密钥文件夹
│   ├── private-dev.key      # 开发环境
│   ├── private-prod.key     # 生产环境
│   └── .gitignore           # keys/*
├── .env                     # 开发环境配置
├── .env.production          # 生产环境配置
└── .gitignore              # 排除整个 keys/ 文件夹
```

## 🔧 配置示例

### 基础配置
```javascript
// mp-nexus.config.js
module.exports = {
  appId: 'your_project_appid',
  privateKeyPath: './private.key',  // 密钥文件路径
  platform: 'weapp',
  // ... 其他配置
};
```

### 基于环境变量的配置
```javascript
// mp-nexus.config.js
module.exports = {
  appId: process.env.MP_APP_ID,
  privateKeyPath: process.env.MP_PRIVATE_KEY_PATH || './private.key',
  platform: 'weapp',
  // ... 其他配置
};
```

### 多环境配置
```javascript
// mp-nexus.config.js
const env = process.env.NODE_ENV || 'development';
const keyPaths = {
  development: './keys/private-dev.key',
  production: './keys/private-prod.key',
  staging: './keys/private-staging.key'
};

module.exports = {
  appId: process.env.MP_APP_ID,
  privateKeyPath: process.env.MP_PRIVATE_KEY_PATH || keyPaths[env],
  platform: 'weapp',
  // ... 其他配置
};
```

## 🛡️ 安全最佳实践

### 1. 绝不要将私钥提交到 Git
始终将私钥文件添加到 `.gitignore`：

```bash
# .gitignore
private.key
private-*.key
keys/
*.key
.env.local
.env.*.local
```

### 2. 在 CI/CD 中使用环境变量
```bash
# .env (用于本地开发)
MP_APP_ID=your_app_id
MP_PRIVATE_KEY_PATH=./keys/private-dev.key

# .env.production
MP_APP_ID=your_production_app_id
MP_PRIVATE_KEY_PATH=./keys/private-prod.key
```

### 3. CI/CD 环境设置
对于 GitHub Actions 或其他 CI/CD 平台：

```yaml
# GitHub Actions 示例
- name: 设置私钥
  run: |
    mkdir -p keys
    echo "${{ secrets.WECHAT_PRIVATE_KEY }}" > keys/private-prod.key
  env:
    WECHAT_PRIVATE_KEY: ${{ secrets.WECHAT_PRIVATE_KEY }}
```

### 4. 文件权限
确保私钥文件具有受限的权限：
```bash
chmod 600 private.key
chmod 600 keys/*.key
```

## 🔗 不同的 AppID 和密钥

### 多个小程序
如果您管理多个小程序，按项目组织密钥：

```
project-root/
├── keys/
│   ├── app1-dev.key
│   ├── app1-prod.key
│   ├── app2-dev.key
│   └── app2-prod.key
├── configs/
│   ├── app1.config.js
│   └── app2.config.js
└── package.json
```

### 环境特定的密钥
不同环境可能需要不同的 AppID 和密钥：

```javascript
// mp-nexus.config.js
const environments = {
  development: {
    appId: 'wxDEV123456789',
    privateKeyPath: './keys/dev.key'
  },
  staging: {
    appId: 'wxSTG123456789', 
    privateKeyPath: './keys/staging.key'
  },
  production: {
    appId: 'wxPROD123456789',
    privateKeyPath: './keys/prod.key'
  }
};

const env = process.env.NODE_ENV || 'development';
const config = environments[env];

module.exports = {
  ...config,
  platform: 'weapp',
  // ... 其他共享配置
};
```

## ❗ 故障排除

### 常见问题

**1. "私钥文件未找到"**
- 检查 `privateKeyPath` 中的文件路径是否正确
- 验证文件是否存在且可读
- 检查文件权限（运行 CLI 的用户应该可读）

**2. "无效的私钥格式"**
- 从微信平台重新下载密钥
- 确保文件在传输过程中没有损坏
- 检查文件不为空且不包含无效字符

**3. "认证失败"**
- 验证 `appId` 是否与私钥关联的小程序匹配
- 确保私钥没有过期（微信可能要求密钥轮换）
- 检查密钥是否为正确小程序生成

**4. "权限被拒绝"**
- 确保您的微信账号具有小程序的开发者权限
- 验证小程序处于开发或已发布状态
- 检查微信平台是否配置了 IP 限制

### 调试命令
```bash
# 测试配置
nexus preview --dry-run --verbose

# 检查文件权限
ls -la private.key

# 验证文件内容（不应为空）
wc -c private.key
```

## 📚 补充资源

- [微信小程序 CI 文档](https://developers.weixin.qq.com/miniprogram/dev/devtools/ci.html)
- [微信开发者平台](https://mp.weixin.qq.com)
- [mp-nexus-cli 配置参考](./config-reference.md)
- [故障排除指南](./troubleshooting.md)

## 🔄 密钥轮换

定期轮换私钥是良好的安全实践：

1. 在微信平台生成新密钥
2. 更新您的配置和 CI/CD 密钥
3. 使用新密钥进行测试
4. 从微信平台删除旧密钥
5. 安全地清理旧密钥文件

记得在所有环境和团队成员之间协调密钥轮换！

## 🎯 快速开始

如果您是第一次使用，最简单的步骤：

1. **获取密钥**：从微信小程序后台下载 `private.key`
2. **放到项目根目录**：与 `package.json` 同级
3. **运行初始化**：`nexus init` 会自动检测到密钥文件
4. **测试配置**：`nexus preview --dry-run` 验证配置正确

## ⚠️ 重要提醒

- **不要分享私钥**：私钥是敏感信息，不要通过聊天工具或邮件分享
- **定期检查权限**：确保只有需要的人员能访问私钥
- **备份策略**：在安全的地方备份私钥，但不要存储在代码仓库中
- **监控使用**：定期检查微信后台的 CI 调用日志，确保没有异常使用
