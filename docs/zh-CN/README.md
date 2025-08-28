# mp-nexus-cli 文档

**语言选择**：[English](../README.md) | [简体中文](README.md)

## 快速导航

### 入门指南
- [概览](overview.md) | [Overview](../overview.md) - 项目功能概览和实现状态
- [CLI 参考](cli-reference.md) | [CLI Reference](../cli-reference.md) - 命令行界面文档
- [配置参考](config-reference.md) | [Configuration Reference](../config-reference.md) - 配置文件和选项

### 开发与架构
- [架构设计](architecture.md) | [Architecture Design](../architecture.md) - 系统架构和设计原则
- [适配器指南](adapters-guide.md) | [Adapters Guide](../adapters-guide.md) - 框架和平台适配器开发
- [开发计划](development-plan.md) | [Development Plan](../development-plan.md) - 项目路线图和进度跟踪

### 高级主题
- [测试策略](testing.md) | [Testing Strategy](../testing.md) - 测试方法和指南
- [通知器指南](notifiers-guide.md) | [Notifiers Guide](../notifiers-guide.md) - 通知系统集成
- [故障排除](troubleshooting.md) | [Troubleshooting](../troubleshooting.md) - 常见问题和解决方案

## 文档结构

```
docs/
├── README.md                    # 英文索引文件
├── overview.md                  # 功能概览和状态
├── architecture.md              # 系统架构设计
├── cli-reference.md             # CLI 命令和选项
├── config-reference.md          # 配置指南
├── adapters-guide.md            # 适配器开发指南
├── notifiers-guide.md           # 通知系统指南
├── testing.md                   # 测试策略和指南
├── troubleshooting.md           # 常见问题和解决方案
├── development-plan.md          # 项目路线图和进度
└── zh-CN/                       # 中文文档
    ├── README.md                # 本索引文件
    ├── overview.md              # 功能概览
    ├── architecture.md          # 架构设计
    ├── cli-reference.md         # CLI 参考
    ├── config-reference.md      # 配置参考
    ├── adapters-guide.md        # 适配器指南
    ├── notifiers-guide.md       # 通知器指南
    ├── testing.md               # 测试策略
    ├── troubleshooting.md       # 故障排除
    └── development-plan.md      # 开发计划
```

## 文档分类

### 📚 用户文档
适用于想在项目中使用 mp-nexus-cli 的用户：
- **入门指南**：[概览](overview.md)、[CLI 参考](cli-reference.md)
- **配置**：[配置参考](config-reference.md)
- **故障排除**：[故障排除指南](troubleshooting.md)

### 🔧 开发者文档
适用于想要贡献或扩展 mp-nexus-cli 的开发者：
- **架构**：[架构设计](architecture.md)
- **开发**：[适配器指南](adapters-guide.md)、[测试策略](testing.md)
- **项目管理**：[开发计划](development-plan.md)

### 🚀 集成文档
适用于将 mp-nexus-cli 集成到工作流中的团队：
- **自动化**：[通知器指南](notifiers-guide.md)
- **CI/CD**：[CLI 参考](cli-reference.md) 中的示例

## 参与文档贡献

### 语言支持
- **英语**：主要文档语言
- **简体中文**：在 `zh-CN/` 目录中提供完整翻译

### 文档标准
- 使用清晰、简洁的语言
- 包含实用示例
- 保持语言版本间的一致性
- 进行更改时更新两种语言

### 更新文档
1. **英文更新**：编辑根 `docs/` 目录中的文件
2. **中文更新**：编辑 `docs/zh-CN/` 中的相应文件
3. **新功能**：更新两种语言版本
4. **交叉引用**：确保保持语言跳转链接

## 快速参考

### 基本命令
```bash
# 初始化配置
nexus init

# 预览项目
nexus preview

# 部署项目
nexus deploy --mode production
```

### 语言选择
```bash
# 使用英文界面
nexus --lang en preview

# 使用中文界面
nexus --lang zh-CN preview
```

### 获取帮助
```bash
# 通用帮助
nexus --help

# 特定命令帮助
nexus preview --help
nexus init --help
```

---

**最后更新**：2025-01-28  
**文档版本**：1.0.0  
**项目状态**：生产就绪（95% 完成）
