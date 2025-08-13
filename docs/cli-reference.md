# CLI 参考（草稿）

## 命令

- `nexus preview`：
  - 描述：构建项目并通过平台 CI 生成预览，若终端支持则在终端打印二维码。
  - 选项：
    - `--mode <env>`：加载 `.env.<env>` 并相应设置 `NODE_ENV`
    - `--desc <text>`：版本描述（若缺省，回落为最近一次 Git 提交标题）
    - `--ver <x.y.z>`：版本号（若缺省，回落为 `package.json` 的 `version`）
    - `--config <path>`：自定义配置文件路径
    - `--dry-run`：不调用平台 CI，仅打印计划执行的步骤
    - `--verbose`：输出更详细日志

- `nexus deploy`：
  - 描述：构建项目并通过平台 CI 以新版本形式上传
  - 选项：同 `preview`

- `nexus init`（增强功能）：
  - 描述：交互式向导生成 `mp-nexus.config.js`

## 退出码

- `0`：成功
- `10x`：输入/配置错误（例如缺少 appId/privateKeyPath）
- `20x`：构建错误（框架适配器）
- `30x`：CI 错误（平台适配器）
- `40x`：环境/运行时错误

## 示例

```bash
nexus preview --mode dev --desc "test preview" 
nexus deploy --mode prod --desc "release v1.2.3" --ver 1.2.3
```

## 说明

- CLI 选项优先级：CLI > .env.<mode> > .env > 配置默认值
- 使用 `--verbose` 打印结构化日志与排障提示


