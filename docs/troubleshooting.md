# Troubleshooting Guide

**Implementation Status**: ✅ **COMPREHENSIVE ERROR HANDLING WITH SOLUTIONS**

## Build Failures (Framework Issues)

### Taro Build Failures
**Symptoms**: Build process fails with Taro-related errors

**Solutions**:
1. **Verify Local Build**: Confirm framework CLI works independently
   ```bash
   # Test Taro CLI directly
   npx taro build --type weapp
   ```

2. **Use Verbose Logging**: Get detailed build information
   ```bash
   nexus preview --verbose
   ```

3. **Check Environment**:
   - Verify Node.js version (>= 18 LTS recommended)
   - Reinstall dependencies: `npm install` or `npm ci`
   - Clear build cache: `rm -rf dist/` and rebuild

4. **Common Issues**:
   - **Missing Dependencies**: Install required Taro packages
   - **Version Conflicts**: Ensure Taro CLI and project versions match
   - **Configuration Issues**: Verify `config/index.js` in Taro projects

### uni-app Build Failures
**Symptoms**: Build process fails with uni-app-related errors

**Solutions**:
1. **Verify Framework Support**: Ensure uni-app adapter is fully implemented
2. **Check Build Command**: Verify correct uni-app build commands
3. **Environment Verification**: Ensure HBuilderX CLI or uni-app CLI is properly installed

## Platform CI Errors (miniprogram-ci)

### Authentication Failures
**Symptoms**: `Invalid appId` or `Private key error`

**Solutions**:
1. **Verify AppID**: Ensure `appId` matches your mini-program project
   ```javascript
   // mp-nexus.config.js
   module.exports = {
     appId: 'wx1234567890abcdef', // Check this matches your project
   };
   ```

2. **Private Key Validation**:
   - Verify `privateKeyPath` points to correct file
   - Ensure private key file has proper permissions (readable)
   - Download fresh private key from WeChat Developer Platform if needed

3. **Environment Variables**: Use environment variables for sensitive data
   ```bash
   # .env
   MP_APP_ID=wx1234567890abcdef
   MP_PRIVATE_KEY_PATH=./private.key
   ```

### Build Output Issues
**Symptoms**: `Project path not found` or `Invalid project structure`

**Solutions**:
1. **Verify Output Directory**: Ensure `outputDir` points to correct build artifacts
   ```javascript
   // For Taro projects
   outputDir: 'dist/weapp'
   
   // For uni-app projects  
   outputDir: 'dist/build/mp-weixin'
   ```

2. **Check Build Completion**: Ensure build process completed successfully before CI upload
3. **Manual Verification**: Verify build output contains required files (`app.json`, `app.js`, etc.)

### Version Compatibility
**Symptoms**: CI operation fails with version-related errors

**Solutions**:
1. **Update miniprogram-ci**: Ensure latest compatible version
   ```bash
   npm update miniprogram-ci
   ```
2. **Version Alignment**: Match miniprogram-ci version with WeChat Developer Tools
3. **Check Official Documentation**: Verify against latest WeChat Mini Program CI guidelines

## QR Code Display Issues

### Terminal Rendering Problems
**Symptoms**: QR code not displayed in terminal or shows garbled characters

**Solutions**:
1. **Terminal Compatibility**: Some terminals don't support ASCII QR code rendering
   - Use file output instead: QR code is automatically saved to `./preview-qrcode.png`
   - Try different terminal emulators (e.g., Windows Terminal, iTerm2)

2. **Encoding Issues**: Terminal encoding problems
   - Ensure terminal supports UTF-8 encoding
   - Try different terminal or shell (bash, zsh, PowerShell)

3. **Verbose Logging**: Find QR code file path and view manually
   ```bash
   nexus preview --verbose
   # Look for: "QR code saved to: ./preview-qrcode.png"
   ```

### QR Code Generation Failures
**Symptoms**: QR code generation fails entirely

**Solutions**:
1. **Check Network**: Ensure stable internet connection for CI operations
2. **Verify Permissions**: Ensure write permissions for QR code file output
3. **Try Alternative**: Use `--dry-run` to test configuration without CI calls

## Git Integration Issues

### Git Information Not Detected
**Symptoms**: Automatic version/description detection fails

**Solutions**:
1. **Repository Validation**: Ensure valid Git repository with commits
   ```bash
   git log --oneline -n 1  # Verify recent commits exist
   ```

2. **Manual Override**: Explicitly provide version and description
   ```bash
   nexus preview --ver 1.0.0 --desc "Manual release"
   ```

3. **Git Configuration**: Ensure proper Git setup
   ```bash
   git config --list  # Verify Git configuration
   ```

### Version Detection Issues
**Symptoms**: Package.json version not detected

**Solutions**:
1. **File Verification**: Ensure `package.json` exists and contains `version` field
2. **Path Issues**: Run command from correct project root directory
3. **Manual Version**: Use `--ver` parameter to override

## Configuration Problems

### Config File Not Found
**Symptoms**: `Configuration file not found` error

**Solutions**:
1. **Generate Configuration**: Use interactive initialization
   ```bash
   nexus init
   ```

2. **Manual Creation**: Create `mp-nexus.config.js` in project root
3. **Custom Path**: Specify configuration file location
   ```bash
   nexus preview --config ./path/to/config.js
   ```

### Environment Variable Issues
**Symptoms**: Environment variables not loaded properly

**Solutions**:
1. **File Location**: Ensure `.env` files are in project root
2. **Mode-Specific**: Use appropriate mode for environment files
   ```bash
   nexus preview --mode production  # Loads .env.production
   ```
3. **Priority Understanding**: Remember CLI > `.env.<mode>` > `.env` > config file

## Network and Performance Issues

### Slow Operations
**Symptoms**: Commands take unusually long to complete

**Solutions**:
1. **Network Optimization**: Check internet connection stability
2. **Retry Configuration**: Built-in retry mechanisms handle transient failures
3. **Verbose Monitoring**: Use `--verbose` to track operation progress

### Timeout Errors
**Symptoms**: Operations timeout before completion

**Solutions**:
1. **Network Stability**: Ensure stable internet connection
2. **Retry Logic**: Tool automatically retries failed operations
3. **Manual Retry**: Re-run failed operations

## Getting Additional Help

### Diagnostic Information
Always include the following when seeking help:

1. **Version Information**:
   ```bash
   nexus --version
   node --version
   ```

2. **Verbose Output**:
   ```bash
   nexus preview --verbose --dry-run
   ```

3. **Environment Details**:
   - Operating system (Windows/macOS/Linux)
   - Framework type and version (Taro/uni-app)
   - Platform target (weapp/alipay/etc.)

### Error Reporting
- ✅ **Structured Error Codes**: Each error type has specific exit code for easy identification
- ✅ **Actionable Messages**: Error messages include specific resolution suggestions
- ✅ **Context Information**: Errors include relevant context (file paths, configurations)
- ✅ **Verbose Mode**: `--verbose` provides detailed diagnostic information for troubleshooting


