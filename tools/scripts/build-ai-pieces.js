#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Directory paths
const repoRoot = path.resolve(__dirname, '../..');
const piecesDir = path.join(repoRoot, 'packages/pieces');
const distDir = path.join(repoRoot, 'dist/packages/pieces');

// Ensure dist directory exists
if (!fs.existsSync(distDir)) {
  fs.mkdirSync(distDir, { recursive: true });
}

console.log('Building custom pieces only...');

try {
  // Check if the custom piece directory exists
  const customDir = path.join(piecesDir, 'custom');
  if (!fs.existsSync(customDir) || !fs.statSync(customDir).isDirectory()) {
    console.log('No custom pieces directory found. Skipping custom piece build.');
    process.exit(0);
  }
  
  // Get all pieces within the custom category
  const pieces = fs.readdirSync(customDir).filter(item => 
    fs.statSync(path.join(customDir, item)).isDirectory()
  );
  
  if (pieces.length === 0) {
    console.log('No custom pieces found. Skipping custom piece build.');
    process.exit(0);
  }
  
  // Build each custom piece
  for (const piece of pieces) {
    const piecePath = path.join(customDir, piece);
    console.log(`Building custom piece: custom/${piece}`);
    
    try {
      // Execute build command for each piece
      execSync(`npx nx build pieces-${piece}`, {
        cwd: repoRoot,
        stdio: 'inherit'
      });
      
      console.log(`Successfully built custom piece: custom/${piece}`);
    } catch (pieceError) {
      console.error(`Failed to build custom piece custom/${piece}: ${pieceError.message}`);
    }
  }
  
  console.log('All custom pieces built successfully!');
} catch (error) {
  console.error('Error building pieces:', error);
  process.exit(1);
}
