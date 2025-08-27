# Testing Strategy

**Implementation Status**: ⚠️ **FRAMEWORK READY, COMPREHENSIVE TESTS NEEDED**

## Test Pyramid Architecture

### Unit Tests (Foundation Layer)
- **Configuration parsing**: Environment priority, config merging logic
- **Utility functions**: Error handling, logger, retry mechanisms, Git information extraction
- **Type validation**: Configuration schema validation and parameter parsing
- **Path handling**: Cross-platform path resolution and validation

### Component Tests (Integration Layer) 
- **Framework adapters**: `detect()`, `build()`, `getOutputPath()` methods with mocked CLI calls
- **Platform adapters**: Preview/upload operations with mocked miniprogram-ci
- **Configuration system**: Multi-environment config loading and priority resolution
- **Error classification**: Proper error code assignment and message generation

### Integration Tests (End-to-End Layer)
- **Complete workflows**: Full `preview`/`deploy` operations using mocked platform adapters
- **CLI interface**: Command parsing and parameter validation
- **Cross-platform compatibility**: Windows/macOS/Linux path and subprocess handling

## Mocks & Test Fixtures

### Platform Adapter Mocks ✅ READY
- **WeChat Mock**: Use built-in mock adapter (`createWeappAdapter`) for predictable results
- **QR Code Generation**: Mock QR code file creation and terminal output
- **Upload Results**: Simulate successful and failed upload scenarios

### External Service Mocks
- **Notification System**: Use `mock://...` webhook URLs to skip real network requests
- **Git Operations**: Mock `simple-git` or provide sample repository fixtures
- **Framework CLIs**: Mock Taro/uni-app CLI calls to avoid real build dependencies

### Test Data Fixtures
- **Sample Projects**: Minimal Taro and uni-app project structures
- **Configuration Files**: Valid and invalid configuration examples
- **Environment Files**: Various `.env` configurations for testing priority

## Test Coverage Requirements

### Core Functionality ✅ IMPLEMENTED IN CODE
- **CLI Parameter Priority**: Verify CLI options override env/config settings
- **Error Code Assignment**: 
  - Build failures return correct codes (60-62)
  - CI failures return correct codes (80-82)
  - Configuration errors return correct codes (3-4)
- **Operation Results**:
  - Preview operations return QR code paths
  - Deploy operations return version numbers
- **Cross-Platform**: Windows/macOS/Linux path handling normalization

### Quality Metrics
- **Core Orchestrator**: Target 80%+ code coverage
- **Adapter Interfaces**: Target 90%+ coverage for critical paths
- **Error Handling**: 100% coverage for error classification logic
- **Configuration System**: 100% coverage for priority and merging logic

## Testing Tools & Framework

### Recommended Stack
- **Test Framework**: Vitest (fast, TypeScript-native) or Jest (mature, well-supported)
- **Mocking**: Built-in vitest/jest mocking capabilities
- **Coverage**: c8 (vitest) or istanbul (jest) for coverage reporting
- **Fixtures**: Custom fixture management for sample projects

### Test Organization
```text
tests/
├─ unit/                    # Unit tests for individual modules
│  ├─ config/              # Configuration parsing tests
│  ├─ utils/               # Utility function tests
│  └─ adapters/            # Adapter interface tests
├─ integration/            # Integration tests
│  ├─ workflows/           # End-to-end workflow tests
│  └─ cli/                 # CLI interface tests
├─ fixtures/               # Test data and sample projects
│  ├─ projects/            # Sample Taro/uni-app projects
│  └─ configs/             # Sample configuration files
└─ mocks/                  # Mock implementations
```

## Implementation Priority

### Phase 1: Foundation Tests ⚠️ NEEDED
1. **Configuration system tests**: Priority, merging, validation
2. **Utility function tests**: Error handling, logging, Git integration
3. **Adapter interface tests**: Mock-based framework and platform adapter tests

### Phase 2: Integration Tests ⚠️ NEEDED  
1. **CLI workflow tests**: End-to-end command execution
2. **Cross-platform tests**: Path handling and subprocess execution
3. **Error scenario tests**: Comprehensive failure mode coverage

### Phase 3: Quality Assurance ⚠️ NEEDED
1. **Performance tests**: Build and deployment timing
2. **Stress tests**: Large project handling and concurrent operations
3. **Compatibility tests**: Multiple Node.js versions and framework versions

## Current Testing Status

- ✅ **Test Infrastructure**: Basic test files present in repository
- ⚠️ **Unit Test Coverage**: Minimal coverage, comprehensive tests needed
- ⚠️ **Integration Tests**: Structure ready, implementations needed
- ✅ **Mock Architecture**: Well-designed for adapter pattern testing
- ⚠️ **CI Integration**: Test automation setup needed


