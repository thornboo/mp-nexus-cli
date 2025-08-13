# 测试策略（草稿）

## 金字塔分层

- 单元测试：配置解析、环境优先级、小型工具函数
- 组件测试：框架适配器（detect/build/outputPath），配合 mock
- 集成测试：编排式 preview/deploy，使用平台适配器 mock 与 webhook mock

## Mocks 与样例数据（Fixtures）

- 平台适配器：使用内置 mock（`createWeappAdapter`），返回可预测结果
- 通知器：使用 `mock://...` webhook，跳过真实网络
- Git：提供样例仓库或 mock `simple-git`

## 覆盖要点

- CLI 参数优先级高于 env/config
- 构建失败返回正确错误码（20x）
- CI 失败返回正确错误码（30x）
- preview 返回二维码路径；deploy 返回版本号
- Windows/macOS/Linux 路径处理（至少在测试中进行规范化）

## 工具

- 测试框架：vitest/jest
- 覆盖率：核心编排与适配器力争 80%+


