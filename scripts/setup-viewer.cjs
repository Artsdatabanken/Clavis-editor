#!/usr/bin/env node

/**
 * Sets up clavis-viewer-web from a local directory or GitHub dev branch.
 * Run this after 'npm install' when on the dev branch.
 *
 * Usage: npm run setup-dev
 *
 * Looks for local viewer at: ../clavis-viewer-web (sibling directory)
 * Falls back to GitHub dev branch if not found.
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');
const os = require('os');

const projectRoot = path.join(__dirname, '..');
const viewerPath = path.join(projectRoot, 'node_modules', '@artsdatabanken', 'clavis-viewer-web');
const localViewerPath = path.join(projectRoot, '..', 'clavis-viewer-web');

function run(cmd, cwd) {
  console.log(`> ${cmd}`);
  execSync(cmd, { stdio: 'inherit', cwd: cwd || projectRoot });
}

function getCurrentBranch() {
  try {
    return execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf-8', cwd: projectRoot }).trim();
  } catch {
    return 'unknown';
  }
}

function hasLocalViewer() {
  return fs.existsSync(localViewerPath) && fs.existsSync(path.join(localViewerPath, 'package.json'));
}

const branch = getCurrentBranch();
console.log(`Current branch: ${branch}`);

if (branch !== 'dev') {
  console.log('Not on dev branch - using npm version of clavis-viewer-web');
  process.exit(0);
}

// Check if the viewer exists (from npm install)
if (!fs.existsSync(viewerPath)) {
  console.error('clavis-viewer-web not found. Run "npm install" first.');
  process.exit(1);
}

const useLocal = hasLocalViewer();
if (useLocal) {
  console.log(`\nUsing local clavis-viewer-web from: ${localViewerPath}\n`);
} else {
  console.log('\nNo local clavis-viewer-web found, using GitHub dev branch...\n');
}

// Use a temp directory for building
const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'clavis-viewer-'));
console.log(`Build directory: ${tempDir}\n`);

try {
  if (useLocal) {
    // Copy from local directory (excluding node_modules and .git)
    console.log('Copying source files...\n');
    const items = fs.readdirSync(localViewerPath);
    for (const item of items) {
      if (item === 'node_modules' || item === '.git' || item === 'dist') continue;
      const src = path.join(localViewerPath, item);
      const dest = path.join(tempDir, item);
      fs.cpSync(src, dest, { recursive: true });
    }
  } else {
    // Clone from GitHub
    run('git clone --depth 1 --branch dev https://github.com/Artsdatabanken/clavis-viewer-web.git .', tempDir);
  }

  // Install dependencies
  console.log('\nInstalling dependencies...\n');
  run('npm install --legacy-peer-deps --ignore-scripts', tempDir);

  // Build the package
  console.log('\nBuilding...\n');
  run('npm run build', tempDir);

  // Verify the build
  const tempDist = path.join(tempDir, 'dist');
  if (!fs.existsSync(tempDist)) {
    throw new Error('Build failed - dist folder not created');
  }

  // Copy built files to node_modules
  console.log('\nCopying to node_modules...\n');

  // Wipe the npm-installed viewer-web (latest published) entirely. Otherwise its
  // nested node_modules/react and other transitive artifacts persist alongside
  // the new dist, and Vite ends up bundling two Reacts → React error #525
  // ('A React Element from an older version of React was rendered').
  fs.rmSync(viewerPath, { recursive: true, force: true });
  fs.mkdirSync(viewerPath, { recursive: true });

  const targetDist = path.join(viewerPath, 'dist');
  fs.cpSync(tempDist, targetDist, { recursive: true });
  fs.copyFileSync(path.join(tempDir, 'package.json'), path.join(viewerPath, 'package.json'));

  // Vite caches resolved modules under node_modules/.vite. Stale entries
  // pointing at the just-wiped viewer-web break the next build.
  const cacheDir = path.join(projectRoot, 'node_modules', '.vite');
  if (fs.existsSync(cacheDir)) {
    console.log('Clearing .vite cache...');
    fs.rmSync(cacheDir, { recursive: true });
  }

  console.log(`\n✓ clavis-viewer-web successfully updated from ${useLocal ? 'local directory' : 'GitHub dev branch'}`);
} finally {
  // Clean up temp directory
  console.log('\nCleaning up...');
  fs.rmSync(tempDir, { recursive: true, force: true });
}
