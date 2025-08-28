# 故障排除指南

**实现状态**：✅ **具有解决方案的全面错误处理**

## 构建失败（框架问题）

### Taro 构建失败
**症状**：构建过程失败，出现 Taro 相关错误

**解决方案**：
1. **验证本地构建**：确认框架 CLI 可以独立工作
   ```bash
   # 直接测试 Taro CLI
   npx taro build --type weapp
   ```

2. **使用详细日志**：获取详细的构建信息
   ```bash
   nexus preview --verbose
   ```

3. **检查环境**：
   - 验证 Node.js 版本（推荐 >= 18 LTS）
   - 重新安装依赖：`npm install` 或 `npm ci`
   - 清除构建缓存：`rm -rf dist/` 并重新构建

4. **常见问题**：
   - **依赖缺失**：安装必需的 Taro 包
   - **版本冲突**：确保 Taro CLI 和项目版本匹配
   - **配置问题**：验证 Taro 项目中的 `config/index.js`

### uni-app 构建失败
**症状**：构建过程失败，出现 uni-app 相关错误

**解决方案**：
1. **验证框架支持**：确保 uni-app 适配器已完全实现
2. **检查构建命令**：验证正确的 uni-app 构建命令
3. **环境验证**：确保 HBuilderX CLI 或 uni-app CLI 正确安装
4. **项目配置**：检查 `src/manifest.json` 和 `src/pages.json` 文件
5. **依赖检查**：确保安装了正确的 uni-app 相关依赖

## 平台 CI 错误（miniprogram-ci）

### 认证失败
**症状**：`Invalid appId` 或 `Private key error`

**解决方案**：
1. **验证 AppID**：确保 `appId` 与您的小程序项目匹配
   ```javascript
   // mp-nexus.config.js
   module.exports = {
     appId: 'your_project_appid', // 检查这是否与您的项目匹配
   };
   ```

2. **私钥验证**：
   - 验证 `privateKeyPath` 指向正确的文件
   - 确保私钥文件具有适当的权限（可读）
   - 如需要，从微信开发者平台下载新的私钥

3. **环境变量**：对敏感数据使用环境变量
   ```bash
   # .env
   MP_APP_ID=your_app_id
   MP_PRIVATE_KEY_PATH=./private.key
   ```

### 网络错误
**症状**：连接超时或网络相关错误

**解决方案**：
1. **网络连接**：检查互联网连接是否稳定
2. **代理设置**：如果在公司网络内，配置适当的代理
3. **防火墙**：确保防火墙不阻止微信 API 端点
4. **重试机制**：工具包含自动重试，但严重网络问题可能需要多次尝试

## QR 码问题

### QR 码不显示
**症状**：预览成功但 QR 码未在终端显示

**解决方案**：
1. **终端兼容性**：某些终端可能不支持 ASCII QR 码
   - 尝试使用不同的终端（例如，在 Windows 上使用 Windows Terminal）
   - 检查保存的 QR 码图片文件

2. **字符编码**：确保终端使用 UTF-8 编码

3. **检查文件输出**：QR 码总是保存为图片文件
   ```bash
   # QR 码图片将保存在当前目录
   ls -la preview-qrcode.png
   ```

## Git 集成问题

### Git 信息检测失败
**症状**：无法获取 Git 提交信息或版本

**解决方案**：
1. **Git 仓库**：确保在 Git 仓库中运行命令
   ```bash
   git status  # 验证这是一个 Git 仓库
   ```

2. **提交历史**：确保存在提交历史
   ```bash
   git log --oneline -1  # 检查最新提交
   ```

3. **手动指定**：在 Git 检测失败时使用 CLI 选项
   ```bash
   nexus deploy --desc "手动版本描述" --ver "1.0.0"
   ```

## 配置问题

### 配置文件不生效
**症状**：配置更改不被识别

**解决方案**：
1. **文件位置**：确保 `mp-nexus.config.js` 在项目根目录
2. **语法错误**：验证 JavaScript 语法正确
3. **配置优先级**：了解 CLI 选项覆盖配置文件值
4. **使用调试模式**：
   ```bash
   nexus preview --verbose --dry-run  # 查看配置如何解析
   ```

### 环境变量问题
**症状**：`.env` 文件值未被使用

**解决方案**：
1. **文件格式**：确保 `.env` 文件格式正确
   ```bash
   # .env
   MP_APP_ID=your_app_id
   # 无空格，无引号（除非值包含空格）
   ```

2. **文件位置**：`.env` 文件应在项目根目录
3. **模式特定文件**：使用 `--mode` 时检查 `.env.<mode>` 文件

## 语言和国际化问题

### 语言设置不生效
**症状**：界面未显示预期语言

**解决方案**：
1. **语言选项**：使用 `--lang` 选项明确设置
   ```bash
   nexus --lang zh-CN preview
   ```

2. **环境变量**：设置 `NEXUS_LANG` 环境变量
   ```bash
   export NEXUS_LANG=zh-CN
   nexus preview
   ```

3. **系统语言检测**：检查系统区域设置
   ```bash
   echo $LANG  # Linux/macOS
   echo $LANGUAGE  # Windows
   ```

## 权限问题

### 文件权限错误
**症状**：`EACCES` 或权限被拒绝错误

**解决方案**：
1. **文件权限**：检查私钥文件权限
   ```bash
   chmod 600 private.key  # 设置私钥文件权限
   ```

2. **目录权限**：确保对项目目录有写权限
3. **运行权限**：在某些系统上可能需要提升权限

## 性能问题

### 构建缓慢
**症状**：构建过程比预期慢

**解决方案**：
1. **依赖优化**：清理 `node_modules` 并重新安装
2. **磁盘空间**：确保有足够的磁盘空间
3. **并发限制**：某些系统可能需要限制并发构建

### 内存问题
**症状**：`JavaScript heap out of memory` 错误

**解决方案**：
1. **增加内存**：
   ```bash
   node --max-old-space-size=4096 $(which nexus) preview
   ```

2. **减少构建大小**：优化项目依赖和资源

## 调试技巧

### 详细日志
始终从详细日志开始：
```bash
nexus preview --verbose
```

### 干运行模式
测试配置而不执行实际操作：
```bash
nexus preview --dry-run --verbose
```

### JSON 输出
用于 CI/CD 集成的结构化输出：
```bash
nexus deploy --json > result.json
```

### 检查工具版本
```bash
nexus --version
node --version
npm --version
```

## 获取帮助

### 内置帮助
```bash
nexus --help
nexus preview --help
nexus init --help
```

### 常见命令
```bash
# 基本预览
nexus preview

# 详细调试信息
nexus preview --verbose --dry-run

# 特定环境部署
nexus deploy --mode production --verbose
```

### 错误报告
报告问题时，请包含：
1. 完整的错误消息
2. 使用 `--verbose` 的详细日志
3. 系统信息（OS、Node.js 版本）
4. 项目配置（敏感信息已脱敏）

这个故障排除指南涵盖了 mp-nexus-cli 的大多数常见问题。如果您遇到未涵盖的问题，请考虑提交详细的错误报告。
