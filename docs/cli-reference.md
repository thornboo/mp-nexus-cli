# CLI Reference

## Global Options

### Language Selection
- `--lang <language>`: Set interface language (`en` | `zh-CN`)
  - Automatically detects system language if not specified
  - Affects all command descriptions, prompts, and log messages
  - Can also be set via `NEXUS_LANG` environment variable

**Examples**:
```bash
# Use English interface
nexus --lang en --help

# Use Chinese interface  
nexus --lang zh-CN init

# Auto-detect from system (default)
nexus preview
```

## Commands

### `nexus init`
Initialize configuration file interactively.

**Description**: Auto-detect project framework and create configuration through interactive prompts.

**Options**:
- `--force`: Overwrite existing configuration file without confirmation

**Features**:
- Automatic framework detection (Taro/uni-app)
- Multi-platform support (WeChat, Alipay, ByteDance, QQ)
- Optional .env file generation for sensitive data
- Automatic .gitignore updates

### `nexus preview`
Build project and generate preview QR code.

**Description**: Build project using detected framework and generate preview QR code via platform CI. QR code is displayed both in terminal and saved as image file.

**Options**:
- `--mode <env>`: Load `.env.<env>` file and set `NODE_ENV`
- `--desc <text>`: Version description (auto-fallback to latest Git commit message)
- `--ver <x.y.z>`: Version number (auto-fallback to `package.json` version)
- `--config <path>`: Custom configuration file path
- `--dry-run`: Print planned steps without calling platform CI
- `--verbose`: Output detailed logs and debug information
- `--json`: Output structured JSON format results

### `nexus deploy`
Build project and upload as new version.

**Description**: Build project using detected framework and upload to platform as new version.

**Options**: Same as `preview` command

## Exit Codes

- `0`: Success
- `1`: Unknown error
- `2`: Invalid arguments
- `3-4`: Configuration errors
- `20-22`: File system errors
- `40-42`: Network/API errors
- `60-62`: Build errors
- `80-82`: Deployment errors
- `100-102`: Platform-specific errors (WeApp)

## Output Formats

### Human-readable (Default)
```
🎉 Preview completed successfully!
📦 Framework: taro
🎯 Platform: weapp
🏷️  Version: 1.0.0
📝 Description: feat: add new feature
📱 QR code saved: ./preview-qrcode.png
```

### JSON Format (`--json`)
```json
{
  "success": true,
  "timestamp": "2025-01-01T00:00:00.000Z",
  "operation": "preview",
  "data": {
    "success": true,
    "qrcodeImagePath": "./preview-qrcode.png"
  },
  "metadata": {
    "framework": "taro",
    "platform": "weapp",
    "version": "1.0.0",
    "description": "feat: add new feature"
  }
}
```

## Examples

### Basic Usage
```bash
# Initialize configuration
nexus init

# Preview with auto-detected settings
nexus preview

# Deploy with specific version
nexus deploy --ver 1.2.3 --desc "Release version 1.2.3"
```

### Advanced Usage
```bash
# Preview with environment mode
nexus preview --mode development --verbose

# Deploy with JSON output for CI/CD
nexus deploy --json --mode production

# Dry run to check configuration
nexus preview --dry-run --verbose
```

### CI/CD Integration
```bash
# GitHub Actions example
nexus deploy --json --mode production --desc "$GITHUB_SHA" > deploy-result.json
```

## Configuration Priority

1. CLI options (highest priority)
2. Environment variables from `.env.<mode>` file
3. Environment variables from `.env` file
4. Configuration file values
5. Default values (lowest priority)

## Auto-detection Features

- **Framework Detection**: Automatically detects Taro or uni-app projects
- **Git Integration**: Uses latest commit message as default description
- **Version Detection**: Uses package.json version as default version number
- **Output Path**: Automatically determines build output directory


