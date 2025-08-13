# examples

示例目录用于验证 mp-nexus-cli 在 Taro 与 uni-app 项目中的最小接入方式。示例仅提供骨架文件，请在真实项目或补齐依赖后再运行命令。

## 目录

- `taro/`：Taro 项目示例（产物目录默认 `dist/weapp`）
- `uni/`：uni-app 项目示例（产物目录建议 `dist/build/mp-weixin`）

## 使用步骤

1. 在对应目录的 `mp-nexus.config.js` 中填入你的 `appId` 和 `privateKeyPath`。
2. 在该示例目录下执行 CLI 命令：

```bash
# 预览
nexus preview --mode dev --desc "examples preview"

# 部署
nexus deploy --mode prod --desc "examples deploy" --ver 0.1.0
```

> 注意：示例并未包含完整框架依赖与代码，建议在你的真实项目中验证。


