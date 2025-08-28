# CLI 参考

## 全局选项

### 语言选择
- `--lang <language>`：设置界面语言（`en` | `zh-CN`）
  - 如果未指定，自动检测系统语言
  - 影响所有命令描述、提示和日志消息
  - 也可以通过 `NEXUS_LANG` 环境变量设置

**示例**：
```bash
# 使用英文界面
nexus --lang en --help

# 使用中文界面
nexus --lang zh-CN init

# 从系统自动检测（默认）
nexus preview
```

## 命令

### `nexus init`
交互式初始化配置文件。

**说明**：自动检测项目框架并通过交互式提示创建配置。

**选项**：
- `--force`：强制覆盖现有配置文件，无需确认

**功能**：
- 自动框架检测（Taro/uni-app）
- 多平台支持（微信、支付宝、字节跳动、QQ）
- 可选的敏感数据 .env 文件生成
- 自动 .gitignore 更新

### `nexus preview`
构建项目并生成预览二维码。

**说明**：使用检测到的框架构建项目，并通过平台 CI 生成预览二维码。二维码会同时在终端显示并保存为图片文件。

**选项**：
- `--mode <env>`：加载 `.env.<env>` 文件并设置 `NODE_ENV`
- `--desc <text>`：版本描述（自动回退到最新 Git 提交消息）
- `--ver <x.y.z>`：版本号（自动回退到 `package.json` 版本）
- `--config <path>`：自定义配置文件路径
- `--dry-run`：打印计划步骤而不调用平台 CI
- `--verbose`：输出详细日志和调试信息
- `--json`：输出结构化 JSON 格式结果

### `nexus deploy`
构建项目并上传为新版本。

**说明**：使用检测到的框架构建项目并上传到平台作为新版本。

**选项**：与 `preview` 命令相同

## 退出码

- `0`：成功
- `1`：未知错误
- `2`：无效参数
- `3-4`：配置错误
- `20-22`：文件系统错误
- `40-42`：网络/API 错误
- `60-62`：构建错误
- `80-82`：部署错误
- `100-102`：平台特定错误（微信小程序）

## 输出格式

### 人类可读格式（默认）
```
🎉 预览完成成功！
📦 框架：taro
🎯 平台：weapp
🏷️ 版本：1.0.0
📝 描述：feat: 添加新功能
📱 二维码已保存：./preview-qrcode.png
```

### JSON 格式（`--json`）
```json
{
  "success": true,
  "timestamp": "2025-01-01T00:00:00.000Z",
  "operation": "preview",
  "data": {
    "success": true,
    "qrcodeImagePath": "./preview-qrcode.png"
  },
  "metadata": {
    "framework": "taro",
    "platform": "weapp",
    "version": "1.0.0",
    "description": "feat: 添加新功能"
  }
}
```

## 使用示例

### 基础用法
```bash
# 初始化配置
nexus init

# 使用自动检测设置预览
nexus preview

# 部署指定版本
nexus deploy --ver 1.2.3 --desc "发布版本 1.2.3"
```

### 高级用法
```bash
# 使用环境模式预览
nexus preview --mode development --verbose

# 部署并输出 JSON 格式用于 CI/CD
nexus deploy --json --mode production

# 干运行检查配置
nexus preview --dry-run --verbose
```

### CI/CD 集成
```bash
# GitHub Actions 示例
nexus deploy --json --mode production --desc "$GITHUB_SHA" > deploy-result.json
```

## 配置优先级

1. CLI 选项（最高优先级）
2. `.env.<mode>` 文件中的环境变量
3. `.env` 文件中的环境变量
4. 配置文件值
5. 默认值（最低优先级）

## 自动检测功能

- **框架检测**：自动检测 Taro 或 uni-app 项目
- **Git 集成**：使用最新提交消息作为默认描述
- **版本检测**：使用 package.json 版本作为默认版本号
- **输出路径**：自动确定构建输出目录

