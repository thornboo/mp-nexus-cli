# Example Projects

This directory contains example projects for testing and demonstrating `mp-nexus-cli` functionality with Taro and uni-app frameworks.

## Directory Structure

- `taro/`: Taro project example (default output: `dist/weapp`)
- `uni/`: uni-app project example (default output: `dist/build/mp-weixin`)

## Quick Start

### Option 1: Interactive Setup (Recommended)
```bash
cd examples/taro  # or examples/uni
nexus init
```

### Option 2: Manual Configuration
1. Edit the `mp-nexus.config.js` file in the desired example directory
2. Set your actual `appId` and `privateKeyPath` values
3. Or use environment variables:
   ```bash
   export MP_APP_ID="your-actual-app-id"
   export MP_PRIVATE_KEY_PATH="./path/to/your/private.key"
   ```

## Testing Commands

```bash
# Test preview with auto-detection
nexus preview --dry-run --verbose

# Test deployment
nexus deploy --dry-run --mode prod --desc "example deploy" --ver 0.1.0

# Test JSON output format
nexus preview --json --dry-run

# Test different environment modes
nexus preview --mode development --dry-run
```

## Features Demonstrated

- ✅ **Framework Auto-detection**: Automatically detects Taro/uni-app projects
- ✅ **Environment Configuration**: Uses environment variables for sensitive data
- ✅ **Git Integration**: Automatic version and description detection
- ✅ **Structured Output**: Both human-readable and JSON formats
- ✅ **Error Handling**: Comprehensive error classification and suggestions

> **Note**: These examples provide minimal project skeletons. For complete functionality testing, use in real projects with full dependencies installed.


