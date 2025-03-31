const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Ensure public directory exists
if (!fs.existsSync('public')) {
  fs.mkdirSync('public', { recursive: true });
}

// Check if index.html exists in public
const publicIndexPath = path.join('public', 'index.html');
const rootIndexPath = path.join('.', 'index.html');

// If index.html exists in root but not in public, copy it
if (fs.existsSync(rootIndexPath) && !fs.existsSync(publicIndexPath)) {
  console.log('Copying index.html from root to public directory');
  fs.copyFileSync(rootIndexPath, publicIndexPath);
}

// Run the actual build
console.log('Running build command...');
try {
  execSync('react-scripts build', { stdio: 'inherit' });
  console.log('Build completed successfully');
} catch (error) {
  console.error('Build failed:', error);
  process.exit(1);
} 