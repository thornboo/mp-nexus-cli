# 故障诊断（草稿）

## 构建失败（Taro/uni）

- 确认可使用框架 CLI 在本地成功构建
- 使用 `--verbose` 查看详细日志
- 检查 Node 版本并重装依赖

## CI 调用错误（miniprogram-ci）

- 确保 `appId` 与 `privateKeyPath` 有效
- 确认 `outputDir` 指向正确的构建产物目录
- 尝试将 `miniprogram-ci` 版本与 IDE/官方指引保持一致

## 二维码不显示

- 某些终端不支持 ASCII 二维码渲染；可输出到文件查看
- 使用 `--verbose` 查找二维码文件路径与潜在错误

## Git 信息未注入

- 确保仓库至少存在一次有效提交
- 或显式传入 `--desc`/`--ver`


