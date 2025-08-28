#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const packagePath = path.join(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

console.log(`📦 Publishing ${packageJson.name} v${packageJson.version} to NPM`);

function run(command, options = {}) {
  console.log(`🔨 Running: ${command}`);
  try {
    execSync(command, { stdio: 'inherit', ...options });
  } catch (error) {
    console.error(`❌ Command failed: ${command}`);
    throw error;
  }
}

async function publishToNpm() {
  try {
    // Pre-publish checks
    console.log('🔍 Running pre-publish checks...');
    
    // Check if logged in to npm
    try {
      const whoami = execSync('npm whoami', { encoding: 'utf8', stdio: 'pipe' });
      console.log(`✅ Logged in as: ${whoami.trim()}`);
    } catch (error) {
      console.error('❌ Not logged in to NPM. Please run: npm login');
      process.exit(1);
    }
    
    // Check if package name is available (for new packages)
    console.log('🔍 Checking package availability...');
    try {
      execSync(`npm view ${packageJson.name}`, { stdio: 'pipe' });
      console.log(`ℹ️  Package ${packageJson.name} already exists, will update version`);
    } catch (error) {
      console.log(`✅ Package name ${packageJson.name} is available`);
    }
    
    // Clean and build
    console.log('🧹 Cleaning and building...');
    run('npm run build');
    
    // Run tests
    console.log('🧪 Running tests...');
    run('npm test');
    
    // Check files that will be published
    console.log('📋 Checking files to be published...');
    run('npm pack --dry-run');
    
    // Confirm publication
    console.log(`\n📤 Ready to publish ${packageJson.name}@${packageJson.version} to NPM`);
    console.log('Files shown above will be published.');
    
    // Publish to NPM
    console.log('\n📤 Publishing to NPM...');
    run('npm publish --registry=https://registry.npmjs.org');
    
    console.log('\n🎉 Successfully published to NPM!');
    console.log(`📥 Install with: npm install -g ${packageJson.name}`);
    console.log(`📊 View on NPM: https://www.npmjs.com/package/${packageJson.name}`);
    
    // Create git tag
    const tagName = `v${packageJson.version}`;
    console.log(`\n🏷️  Creating git tag: ${tagName}`);
    try {
      run(`git tag ${tagName}`);
      run(`git push origin ${tagName}`);
      console.log('✅ Git tag created and pushed');
    } catch (error) {
      console.warn('⚠️  Failed to create git tag (this is optional)');
    }
    
  } catch (error) {
    console.error('\n❌ Publication failed:', error.message);
    process.exit(1);
  }
}

// Show usage information
if (process.argv.includes('--help') || process.argv.includes('-h')) {
  console.log(`
Usage: node scripts/publish-npm.js [options]

Options:
  --help, -h     Show this help message
  --dry-run      Show what would be published without actually publishing

Before publishing:
1. Make sure you're logged in: npm login
2. Update version if needed: npm version patch|minor|major
3. Ensure all tests pass: npm test
4. Ensure build works: npm run build

This script will:
- Check NPM authentication
- Build the project
- Run tests
- Show files to be published
- Publish to NPM registry
- Create git tag
`);
  process.exit(0);
}

// Dry run mode
if (process.argv.includes('--dry-run')) {
  console.log('🔍 Dry run mode - showing what would be published');
  console.log(`Package: ${packageJson.name}@${packageJson.version}`);
  run('npm pack --dry-run');
  process.exit(0);
}

// Run the publish process
publishToNpm();
