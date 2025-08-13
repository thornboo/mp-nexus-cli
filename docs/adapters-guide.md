# 适配器指南（草稿）

## 框架适配器（Framework Adapters）

职责：
- `detect(cwd)`：若支持该项目则返回 true。
- `build(options)`：执行框架构建（失败抛错）。
- `getOutputPath(options)`：解析可供上传的产物目录。

提示：
- 处理 Windows/macOS/Linux 差异。
- 推荐使用 `execa`，并将日志透传到提供的 `logger`。

## 平台适配器（Platform Adapters）

职责：
- `preview(options)`：调用平台 CI 生成预览。
- `upload(options)`：调用平台 CI 上传版本。

结果结构：
- `PreviewResult`：`{ success, qrcodeImagePath?, qrcodeUrl?, raw? }`
- `UploadResult`：`{ success, version?, projectUrl?, raw? }`

测试：
- 提供 mock 模式，或在集成测试中使用内置的 weapp mock 适配器。


