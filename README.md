# mp-nexus-cli

统一小程序项目的一键预览/部署 CLI。聚合框架构建（Taro/uni-app）与 `miniprogram-ci` 上传/预览，提供标准化流程与可扩展适配器体系。

## 新功能特性

✨ **最新更新**：
- 🚀 **交互式初始化**：`nexus init` 命令自动检测项目并生成配置
- 🔄 **Git 信息集成**：自动使用 commit message 作为描述，package.json 版本作为版本号
- 📊 **结构化输出**：支持 `--json` 参数输出 JSON 格式结果，适配 CI/CD 流程
- 🛡️ **增强错误处理**：智能错误分类、重试机制和详细的解决建议
- 🎯 **终端二维码**：直接在命令行显示预览二维码，无需额外工具

## 快速开始

1) 安装（占位，发布后替换为 npm 包名）

```bash
# 全局安装（待发布）
npm i -g mp-nexus-cli

# 本地开发（仓库克隆后）
# 选择你使用的包管理器
npm i
npm run build
```

2) 在你的小程序项目根目录新增 `mp-nexus.config.js`：

```ts
// mp-nexus.config.js
module.exports = {
  projectType: 'taro',        // 或 'uni-app'，可省略由 CLI 自动识别
  platform: 'weapp',          // 目标平台：weapp/alipay/...
  appId: 'wx1234567890abcd',  // 替换为你的真实 AppID
  privateKeyPath: './private.key',
  projectPath: '.',
  outputDir: 'dist/weapp',
  ciOptions: {}
}
```

3) 常用命令

```bash
# 初始化配置：交互式创建配置文件
nexus init

# 预览：编译 + 生成二维码（终端渲染）
nexus preview --mode dev --desc "test preview"

# 部署：编译 + 上传为新版本
nexus deploy --mode prod --desc "release: v1.2.3" --ver 1.2.3

# 通用参数
# --mode <env>   指定 .env 文件模式（如 production）
# --desc <text>  版本描述；若未提供，自动读取最近一次 Git 提交
# --ver <x.y.z>  版本号；若未提供，读取 package.json version
# --dry-run      仅打印将要执行的步骤，不真正上传/预览
# --verbose      输出更详细的过程日志
# --json         输出结构化 JSON 格式结果（适用于 CI/CD）
```

## 文档索引

- Overview：`docs/overview.md`
- Architecture：`docs/architecture.md`
- Development Plan：`docs/development-plan.md`
- CLI Reference：`docs/cli-reference.md`
- Config Reference：`docs/config-reference.md`
- Adapters Guide：`docs/adapters-guide.md`
- Notifiers Guide：`docs/notifiers-guide.md`
- Testing：`docs/testing.md`
- Troubleshooting：`docs/troubleshooting.md`

## 示例项目（examples）

仓库内提供最小骨架，便于验证 CLI 行为与参数传递：

- `examples/taro/`：Taro 项目骨架与 `mp-nexus.config.js` 示例（产物目录默认 `dist/weapp`）
- `examples/uni/`：uni-app 项目骨架与 `mp-nexus.config.js` 示例

使用方式：

1) 将你的真实小程序 `appId` 与私钥路径写入对应 `mp-nexus.config.js`
2) 在各自示例目录内执行命令（或在你的真实项目中使用）

```bash
cd examples/taro
nexus preview --mode dev --desc "examples taro preview"

cd ../uni
nexus deploy --mode prod --desc "examples uni deploy" --ver 0.1.0
```

> 注意：示例目录仅为占位骨架，未内置完整 Taro/uni 依赖与代码。请在真实项目中验证，或自行补齐示例依赖。

## 参考

- 微信小程序 CI 文档：`https://developers.weixin.qq.com/miniprogram/dev/devtools/ci.html`
- Taro CLI：`https://docs.taro.zone/docs/cli`
- uni-app CLI：`https://uniapp.dcloud.net.cn/worktile/CLI.html`

## 故障诊断 / 常见问题（FAQ）

- 构建失败（Taro/uni）：
  - 确认本地可单独成功执行框架构建命令（Taro/uni CLI）。
  - 使用 `--verbose` 获取详细日志；检查 Node 版本与依赖安装情况。
  - Windows 下注意路径与 shell 差异，尽量避免中文或空格路径。

- CI 调用失败（miniprogram-ci）：
  - 检查 `appId` 与 `privateKeyPath` 是否正确；私钥不得入库泄露。
  - 确认 `outputDir` 指向正确的小程序产物目录。
  - 升级/匹配 `miniprogram-ci` 版本，避免与开发者工具版本强绑定的兼容问题。

- 预览二维码不显示：
  - 确认终端支持 ASCII 渲染；或落地到文件查看。
  - 使用 `--verbose` 查看二维码生成路径与错误详情。

- Git 信息未自动注入：
  - 确认仓库存在有效的 commit；或手动传入 `--desc`、`--ver`。

## GitHub Actions CI 示例

在项目仓库中新增 `.github/workflows/preview.yml`：

```yaml
name: MiniProgram Preview

on:
  workflow_dispatch:
  pull_request:
    branches: [ main ]

jobs:
  preview:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 18
      - run: npm ci
      - run: npm run build --if-present
      - name: Preview
        env:
          MP_APP_ID: ${{ secrets.MP_APP_ID }}
          MP_PRIVATE_KEY: ${{ secrets.MP_PRIVATE_KEY }}
        run: |
          echo "$MP_PRIVATE_KEY" > private.key
          npx mp-nexus-cli preview --mode dev --desc "CI preview for $GITHUB_SHA"

```

> 提示：将 `MP_APP_ID` 与 `MP_PRIVATE_KEY` 存入仓库 Secrets；`mp-nexus.config.js` 中读取 `.env` 或环境变量以避免硬编码。
