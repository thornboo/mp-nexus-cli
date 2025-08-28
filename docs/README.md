# mp-nexus-cli Documentation

**Language Selection**: [English](README.md) | [简体中文](zh-CN/README.md)

## Quick Navigation

### Getting Started
- [Overview](overview.md) | [概览](zh-CN/overview.md) - Project feature overview and implementation status
- [CLI Reference](cli-reference.md) | [CLI 参考](zh-CN/cli-reference.md) - Command-line interface documentation
- [Configuration Reference](config-reference.md) | [配置参考](zh-CN/config-reference.md) - Configuration file and options

### Development & Architecture
- [Architecture Design](architecture.md) | [架构设计](zh-CN/architecture.md) - System architecture and design principles
- [Adapters Guide](adapters-guide.md) | [适配器指南](zh-CN/adapters-guide.md) - Framework and platform adapter development
- [Development Plan](development-plan.md) | [开发计划](zh-CN/development-plan.md) - Project roadmap and progress tracking

### Advanced Topics
- [Testing Strategy](testing.md) | [测试策略](zh-CN/testing.md) - Testing approach and guidelines
- [Notifiers Guide](notifiers-guide.md) | [通知器指南](zh-CN/notifiers-guide.md) - Notification system integration
- [Troubleshooting](troubleshooting.md) | [故障排除](zh-CN/troubleshooting.md) - Common issues and solutions

## Documentation Structure

```
docs/
├── README.md                    # This index file
├── overview.md                  # Feature overview and status
├── architecture.md              # System architecture design
├── cli-reference.md             # CLI commands and options
├── config-reference.md          # Configuration guide
├── adapters-guide.md            # Adapter development guide
├── notifiers-guide.md           # Notification system guide
├── testing.md                   # Testing strategy and guidelines
├── troubleshooting.md           # Common issues and solutions
├── development-plan.md          # Project roadmap and progress
└── zh-CN/                       # Chinese documentation
    ├── README.md                # Chinese index
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

## Documentation Categories

### 📚 User Documentation
For users who want to use mp-nexus-cli in their projects:
- **Getting Started**: [Overview](overview.md), [CLI Reference](cli-reference.md)
- **Configuration**: [Configuration Reference](config-reference.md)
- **Troubleshooting**: [Troubleshooting Guide](troubleshooting.md)

### 🔧 Developer Documentation
For developers who want to contribute or extend mp-nexus-cli:
- **Architecture**: [Architecture Design](architecture.md)
- **Development**: [Adapters Guide](adapters-guide.md), [Testing Strategy](testing.md)
- **Project Management**: [Development Plan](development-plan.md)

### 🚀 Integration Documentation
For teams integrating mp-nexus-cli into their workflow:
- **Automation**: [Notifiers Guide](notifiers-guide.md)
- **CI/CD**: Examples in [CLI Reference](cli-reference.md)

## Contributing to Documentation

### Language Support
- **English**: Primary documentation language
- **Simplified Chinese**: Complete translation available in `zh-CN/` directory

### Documentation Standards
- Use clear, concise language
- Include practical examples
- Maintain consistency between language versions
- Update both languages when making changes

### Updating Documentation
1. **For English updates**: Edit files in the root `docs/` directory
2. **For Chinese updates**: Edit corresponding files in `docs/zh-CN/`
3. **For new features**: Update both language versions
4. **Cross-references**: Ensure language jump links are maintained

## Quick Reference

### Essential Commands
```bash
# Initialize configuration
nexus init

# Preview project
nexus preview

# Deploy project
nexus deploy --mode production
```

### Language Selection
```bash
# Use English interface
nexus --lang en preview

# Use Chinese interface
nexus --lang zh-CN preview
```

### Getting Help
```bash
# General help
nexus --help

# Command-specific help
nexus preview --help
nexus init --help
```

---

**Last Updated**: 2025-01-28  
**Documentation Version**: 1.0.0  
**Project Status**: Production Ready (95% Complete)
