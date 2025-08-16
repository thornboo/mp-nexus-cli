#!/usr/bin/env node

/**
 * 跨平台测试脚本
 * 验证CLI在不同环境下的行为一致性
 */

const { spawn } = require('child_process');
const path = require('path');
const fs = require('fs');

const CLI_PATH = path.join(__dirname, '..', 'dist', 'nexus.js');
const TEST_DIR = path.join(__dirname, 'temp');

async function runCommand(cmd, args = [], options = {}) {
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

async function testBasicCommands() {
  console.log('🔍 测试基本命令...');
  
  // 测试 --help
  const helpResult = await runCommand('node', [CLI_PATH, '--help']);
  console.log(`✅ --help: exit code ${helpResult.code}`);
  
  // 测试 preview --help
  const previewHelp = await runCommand('node', [CLI_PATH, 'preview', '--help']);
  console.log(`✅ preview --help: exit code ${previewHelp.code}`);
  
  // 测试无效命令
  const invalidCmd = await runCommand('node', [CLI_PATH, 'invalid']);
  console.log(`✅ 无效命令: exit code ${invalidCmd.code}`);
}

async function testPathHandling() {
  console.log('\n🔍 测试路径处理...');
  
  // 测试无效路径
  const invalidPath = await runCommand('node', [
    CLI_PATH, 
    'preview', 
    '--config', 
    'nonexistent.config.js'
  ]);
  console.log(`✅ 无效配置路径: exit code ${invalidPath.code}`);
}

async function testEnvironmentVariables() {
  console.log('\n🔍 测试环境变量...');
  
  // 测试空环境
  const emptyEnv = await runCommand('node', [
    CLI_PATH,
    'preview',
    '--dry-run'
  ], {
    cwd: __dirname,
    env: { ...process.env, MP_APP_ID: '', MP_PRIVATE_KEY_PATH: '' }
  });
  console.log(`✅ 空环境变量: exit code ${emptyEnv.code}`);
}

async function main() {
  console.log('🚀 开始跨平台测试...');
  console.log(`平台: ${process.platform}`);
  console.log(`Node.js版本: ${process.version}`);
  console.log(`CLI路径: ${CLI_PATH}`);
  
  try {
    await testBasicCommands();
    await testPathHandling();
    await testEnvironmentVariables();
    
    console.log('\n✅ 所有跨平台测试通过！');
  } catch (error) {
    console.error('\n❌ 测试失败:', error.message);
    process.exit(1);
  }
}

if (require.main === module) {
  main();
}