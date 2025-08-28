#!/usr/bin/env node

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

const packagePath = path.join(__dirname, '../package.json');
const packageJson = JSON.parse(fs.readFileSync(packagePath, 'utf8'));

console.log(`📦 Publishing ${packageJson.name} v${packageJson.version}`);

// Build the project
console.log('🔨 Building project...');
execSync('npm run build', { stdio: 'inherit' });

// Run tests
console.log('🧪 Running tests...');
execSync('npm test', { stdio: 'inherit' });

try {
  // Publish to NPM (public registry)
  console.log('📤 Publishing to NPM...');
  
  // Temporarily modify package.json for NPM (remove scope for global installation)
  const npmPackageJson = { ...packageJson };
  npmPackageJson.name = 'mp-nexus-cli'; // Remove scope for NPM
  delete npmPackageJson.publishConfig; // Remove GitHub-specific config
  
  fs.writeFileSync(packagePath, JSON.stringify(npmPackageJson, null, 2));
  execSync('npm publish --registry=https://registry.npmjs.org', { stdio: 'inherit' });
  console.log('✅ Published to NPM successfully!');
  
  // Restore original package.json for GitHub
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
  
  // Publish to GitHub Packages
  console.log('📤 Publishing to GitHub Packages...');
  execSync('npm publish --registry=https://npm.pkg.github.com', { stdio: 'inherit' });
  console.log('✅ Published to GitHub Packages successfully!');
  
  console.log('🎉 Package published to both registries!');
  console.log('📥 Install from NPM: npm install -g mp-nexus-cli');
  console.log('📥 Install from GitHub: npm install -g @thornboo/mp-nexus-cli');
  
} catch (error) {
  // Restore original package.json in case of error
  fs.writeFileSync(packagePath, JSON.stringify(packageJson, null, 2));
  console.error('❌ Publication failed:', error.message);
  process.exit(1);
}
