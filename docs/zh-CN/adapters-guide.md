# 适配器开发指南

**实现状态**：✅ **框架就绪** | ⚠️ **需要扩展**

mp-nexus-cli 使用强大的插件架构和适配器模式来支持不同的框架和平台。本指南将帮助您理解当前实现以及如何开发额外的适配器。

## 架构概览

适配器系统已完全实现，包含两个类别：

### 框架适配器 ✅ **已实现**
处理不同前端框架项目的检测和构建
- **Taro 适配器**：✅ **完全实现** - 完整的检测、构建和输出路径解析
- **uni-app 适配器**：✅ **完全实现** - 完整的检测、构建和输出路径解析（100% 完成）

### 平台适配器 ⚠️ **部分实现**  
处理与不同小程序平台 CI 服务的交互
- **微信 (weapp)**：✅ **完全实现** - 完整的 miniprogram-ci 集成
- **支付宝**：❌ **待定** - 接口就绪，需要实现
- **字节跳动 (tt)**：❌ **待定** - 接口就绪，需要实现  
- **QQ**：❌ **待定** - 接口就绪，需要实现

## 框架适配器

框架适配器处理特定前端框架的构建逻辑。

### 接口定义 ✅ **已实现**

```typescript
export interface FrameworkAdapter {
  name: string;
  detect(cwd: string): Promise<boolean>;
  build(options: BuildOptions): Promise<void>;
  getOutputPath(options: BuildOptions): Promise<string>;
}

export interface BuildOptions {
  cwd: string;
  mode?: string; // dev/test/prod/development/production
  env?: Record<string, string>;
  logger: Logger;
  platform?: string; // weapp/alipay/tt/qq
}
```

### 当前实现

#### Taro 适配器 ✅ **已完成** 
**位置**：`src/adapters/framework/taro/index.ts`

**已实现功能**：
- ✅ **项目检测**：通过依赖检查和配置文件识别 Taro 项目
- ✅ **构建执行**：使用正确的平台参数执行 `taro build`
- ✅ **输出路径解析**：自动确定构建产物位置
- ✅ **错误处理**：分类 Taro 特定的构建错误

#### uni-app 适配器 ✅ **完全实现 - 100%**
**位置**：`src/adapters/framework/uni/index.ts`

**已实现功能**：
- ✅ **高级项目检测**：检查依赖、配置文件和 uni-app 特定文件（manifest.json、pages.json）
- ✅ **多种构建策略支持**：npm 脚本、uni CLI、Vue CLI、HBuilderX CLI 检测和执行
- ✅ **多平台支持**：mp-weixin、mp-alipay、mp-baidu、mp-qq 等平台
- ✅ **全面的环境支持**：开发、测试、生产模式和优化
- ✅ **项目配置验证**：验证 package.json、manifest.json、pages.json 和入口文件
- ✅ **构建优化**：条件编译、源映射、压缩和性能选项
- ✅ **增强的错误分类**：15+ 种特定错误类型，提供针对性故障排除建议
- ✅ **全面的输出路径解析**：支持 vue.config.js、package.json、manifest.json 和常规路径
- ✅ **重试机制**：网络和构建操作重试，具有指数退避
- ✅ **跨平台兼容性**：Windows/macOS/Linux 支持

## 平台适配器

平台适配器处理与小程序平台 CI 服务的交互。

### 接口定义 ✅ **已实现**

```typescript
export interface PlatformAdapter {
  name: string;
  preview(options: PreviewOptions): Promise<PreviewResult>;
  deploy(options: DeployOptions): Promise<DeployResult>;
}
```

### 当前实现

#### WeChat 平台适配器 ✅ **已完成**
**位置**：`src/adapters/platform/weapp/index.ts`

**已实现功能**：
- ✅ **预览功能**：生成预览二维码并显示在终端
- ✅ **部署功能**：上传版本到微信小程序后台
- ✅ **错误处理**：微信 CI 特定的错误分类和处理
- ✅ **配置验证**：appId 和私钥路径验证

## 开发新适配器

### 框架适配器开发

1. **创建适配器文件**：
   ```
   src/adapters/framework/{framework-name}/index.ts
   ```

2. **实现接口**：
   ```typescript
   import { FrameworkAdapter, BuildOptions } from '../../../types/adapters';
   
   export class MyFrameworkAdapter implements FrameworkAdapter {
     name = 'my-framework';
     
     async detect(cwd: string): Promise<boolean> {
       // 检测逻辑
     }
     
     async build(options: BuildOptions): Promise<void> {
       // 构建逻辑
     }
     
     async getOutputPath(options: BuildOptions): Promise<string> {
       // 输出路径解析
     }
   }
   ```

3. **注册适配器**：
   在 `src/core/orchestrator.ts` 中添加新适配器。

### 平台适配器开发

1. **创建适配器文件**：
   ```
   src/adapters/platform/{platform-name}/index.ts
   ```

2. **实现接口**：
   ```typescript
   import { PlatformAdapter, PreviewOptions, DeployOptions } from '../../../types/adapters';
   
   export class MyPlatformAdapter implements PlatformAdapter {
     name = 'my-platform';
     
     async preview(options: PreviewOptions): Promise<PreviewResult> {
       // 预览逻辑
     }
     
     async deploy(options: DeployOptions): Promise<DeployResult> {
       // 部署逻辑
     }
   }
   ```

## 测试指南

### 单元测试
每个适配器都应该有对应的单元测试：
```
tests/adapters/framework/{framework-name}.test.js
tests/adapters/platform/{platform-name}.test.js
```

### 集成测试
测试适配器与核心系统的集成：
```javascript
// 示例集成测试
describe('Framework Adapter Integration', () => {
  it('should detect project type correctly', async () => {
    // 测试项目检测
  });
  
  it('should build project successfully', async () => {
    // 测试构建流程
  });
});
```

## 最佳实践

### 错误处理
- 使用统一的错误分类系统
- 提供有用的错误消息和建议
- 实现适当的重试机制

### 配置检测
- 支持多种配置方式
- 提供清晰的自动检测逻辑
- 在检测失败时给出明确提示

### 性能考虑
- 缓存检测结果
- 避免不必要的文件系统操作
- 使用适当的并发控制

### 兼容性
- 支持不同版本的框架/平台 CLI
- 处理跨平台差异（Windows/macOS/Linux）
- 提供向后兼容性

这个架构确保了 mp-nexus-cli 可以轻松扩展以支持新的框架和平台，同时保持代码的清洁和可维护性。
