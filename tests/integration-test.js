#!/usr/bin/env node

/**
 * 集成测试脚本
 * 验证完整的工作流程
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const CLI_PATH = path.join(__dirname, '..', 'dist', 'nexus.js');
const TEST_DIR = path.join(__dirname, 'temp-integration');

function runCommand(cmd, args = [], options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      stdio: 'pipe',
      shell: process.platform === 'win32',
      ...options,
    });

    let stdout = '';
    let stderr = '';

    child.stdout?.on('data', (data) => {
      stdout += data.toString();
    });

    child.stderr?.on('data', (data) => {
      stderr += data.toString();
    });

    child.on('close', (code) => {
      resolve({ code, stdout, stderr });
    });

    child.on('error', reject);
  });
}

async function createTaroTestProject() {
  const taroDir = path.join(TEST_DIR, 'taro-test');
  
  if (!fs.existsSync(taroDir)) {
    fs.mkdirSync(taroDir, { recursive: true });
  }

  // 创建package.json模拟Taro项目
  const packageJson = {
    name: 'test-taro',
    version: '1.0.0',
    dependencies: {
      '@tarojs/taro': '^3.6.0',
      '@tarojs/cli': '^3.6.0'
    }
  };
  
  fs.writeFileSync(
    path.join(taroDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );

  // 创建配置文件
  const config = {
    projectType: 'taro',
    platform: 'weapp',
    appId: 'wx-test-app-id',
    privateKeyPath: './test-private.key',
    projectPath: '.',
    outputDir: 'dist/weapp'
  };
  
  fs.writeFileSync(
    path.join(taroDir, 'mp-nexus.config.js'),
    `module.exports = ${JSON.stringify(config, null, 2)}`
  );

  // 创建私钥文件
  fs.writeFileSync(path.join(taroDir, 'test-private.key'), 'test-private-key-content');

  return taroDir;
}

async function createUniAppTestProject() {
  const uniDir = path.join(TEST_DIR, 'uni-test');
  
  if (!fs.existsSync(uniDir)) {
    fs.mkdirSync(uniDir, { recursive: true });
  }

  // 创建package.json模拟uni-app项目
  const packageJson = {
    name: 'test-uni-app',
    version: '1.0.0',
    dependencies: {
      '@dcloudio/uni-app': '^2.0.0'
    },
    scripts: {
      'build:mp-weixin': 'echo "Mock uni-app build"'
    }
  };
  
  fs.writeFileSync(
    path.join(uniDir, 'package.json'),
    JSON.stringify(packageJson, null, 2)
  );

  // 创建配置文件
  const config = {
    projectType: 'uni-app',
    platform: 'weapp',
    appId: 'wx-test-app-id',
    privateKeyPath: './test-private.key',
    projectPath: '.',
    outputDir: 'dist/build/mp-weixin'
  };
  
  fs.writeFileSync(
    path.join(uniDir, 'mp-nexus.config.js'),
    `module.exports = ${JSON.stringify(config, null, 2)}`
  );

  // 创建私钥文件
  fs.writeFileSync(path.join(uniDir, 'test-private.key'), 'test-private-key-content');

  return uniDir;
}

async function testDryRun() {
  console.log('\n🔍 测试dry-run模式...');
  
  // 测试Taro项目dry-run
  const taroDir = await createTaroTestProject();
  const result = await runCommand('node', [
    CLI_PATH, 
    'preview', 
    '--dry-run', 
    '--verbose'
  ], {
    cwd: taroDir
  });
  
  console.log(`✅ Taro dry-run: exit code ${result.code}`);
  console.log('输出:', result.stdout);
  
  // 测试uni-app项目dry-run
  const uniDir = await createUniAppTestProject();
  const uniResult = await runCommand('node', [
    CLI_PATH,
    'preview',
    '--dry-run',
    '--verbose'
  ], {
    cwd: uniDir
  });
  
  console.log(`✅ uni-app dry-run: exit code ${uniResult.code}`);
  console.log('输出:', uniResult.stdout);
}

async function testFrameworkDetection() {
  console.log('\n🔍 测试框架检测...');
  
  const taroDir = await createTaroTestProject();
  const result = await runCommand('node', [
    CLI_PATH,
    'preview',
    '--dry-run',
    '--verbose'
  ], {
    cwd: taroDir
  });
  
  if (result.stdout.includes('检测到 Taro 项目')) {
    console.log('✅ Taro框架检测成功');
  }
  
  const uniDir = await createUniAppTestProject();
  const uniResult = await runCommand('node', [
    CLI_PATH,
    'preview',
    '--dry-run',
    '--verbose'
  ], {
    cwd: uniDir
  });
  
  if (uniResult.stdout.includes('检测到 uni-app 项目')) {
    console.log('✅ uni-app框架检测成功');
  }
}

async function main() {
  console.log('🚀 开始集成测试...');
  
  // 清理测试目录
  if (fs.existsSync(TEST_DIR)) {
    fs.rmSync(TEST_DIR, { recursive: true, force: true });
  }
  fs.mkdirSync(TEST_DIR, { recursive: true });
  
  try {
    await testDryRun();
    await testFrameworkDetection();
    
    console.log('\n✅ 所有集成测试通过！');
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    process.exit(1);
  } finally {
    // 清理测试目录
    if (fs.existsSync(TEST_DIR)) {
      fs.rmSync(TEST_DIR, { recursive: true, force: true });
    }
  }
}

if (require.main === module) {
  main();
}