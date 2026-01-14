#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const ROOT_DIR = path.join(__dirname, '..');
const DIST_DIR = path.join(ROOT_DIR, 'dist');
const BUILD_DIR = path.join(ROOT_DIR, 'build');

const BUILD_TYPE_RAW = process.argv[2] || 'github';
const BUILD_TYPE = BUILD_TYPE_RAW === 'webstore' ? 'chrome' : BUILD_TYPE_RAW;

console.log(`Building TunePort for: ${BUILD_TYPE.toUpperCase()}`);


function cleanDirs() {
  if (fs.existsSync(BUILD_DIR)) {
    fs.rmSync(BUILD_DIR, { recursive: true });
  }
  fs.mkdirSync(BUILD_DIR, { recursive: true });
}

function copyDist() {
  if (!fs.existsSync(DIST_DIR)) {
    console.error('Error: dist folder not found. Run npm run build first.');
    process.exit(1);
  }

  fs.cpSync(DIST_DIR, BUILD_DIR, { recursive: true });
}

function modifyManifest() {
  const manifestPath = path.join(BUILD_DIR, 'manifest.json');
  const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));

  if (BUILD_TYPE === 'chrome') {

    manifest.name = 'TunePort - YouTube to Spotify';
    manifest.description = 'Add YouTube videos to your Spotify playlists with one click';
    
    manifest.host_permissions = manifest.host_permissions.filter(
      h => !h.includes('lucida.to')
    );
  } else if (BUILD_TYPE === 'firefox') {
    manifest.name = 'TunePort - YouTube to Spotify (Full)';
    manifest.description = 'Add YouTube videos to Spotify playlists and download high-quality audio with lossless source support';
    
    // Firefox requires manifest v2 format for some APIs
    manifest.manifest_version = 2;
    
    // Convert MV3 to MV2 format
    delete manifest.key;
    
    // background service_worker -> scripts
    if (manifest.background?.service_worker) {
      manifest.background = {
        scripts: [manifest.background.service_worker]
      };
    }
    
    // action -> browser_action
    if (manifest.action) {
      manifest.browser_action = manifest.action;
      delete manifest.action;
    }
    
    // host_permissions merge into permissions
    if (manifest.host_permissions) {
      manifest.permissions = [...(manifest.permissions || []), ...manifest.host_permissions];
      delete manifest.host_permissions;
    }
    
    // web_accessible_resources MV2 format
    if (manifest.web_accessible_resources) {
      manifest.web_accessible_resources = manifest.web_accessible_resources
        .flatMap(r => r.resources || []);
    }
    
    // Add Firefox-specific keys
    manifest.browser_specific_settings = {
      gecko: {
        id: "tuneport@microck.dev",
        strict_min_version: "109.0"
      }
    };
  } else {
    manifest.name = 'TunePort - YouTube to Spotify (Full)';
    manifest.description = 'Add YouTube videos to Spotify playlists and download high-quality audio with lossless source support';
  }

  fs.writeFileSync(manifestPath, JSON.stringify(manifest, null, 2));
  console.log('Manifest modified for', BUILD_TYPE);
}

function createDefaultSettings() {
  const settingsContent = BUILD_TYPE === 'chrome' 

    ? { lucida_enabled: false }
    : { lucida_enabled: true };

  const settingsPath = path.join(BUILD_DIR, 'default-settings.json');
  fs.writeFileSync(settingsPath, JSON.stringify(settingsContent, null, 2));
}

function createZip() {
  const zipName = `tuneport-${BUILD_TYPE}-v${require(path.join(ROOT_DIR, 'package.json')).version}.zip`;
  const zipPath = path.join(ROOT_DIR, zipName);

  try {
    if (process.platform === 'win32') {
      execSync(`powershell Compress-Archive -Path "${BUILD_DIR}\\*" -DestinationPath "${zipPath}" -Force`);
    } else {
      execSync(`cd "${BUILD_DIR}" && zip -r "${zipPath}" .`);
    }
    console.log(`Created: ${zipName}`);
  } catch (error) {
    console.error('Failed to create zip:', error.message);
  }
}

async function main() {
  console.log('1. Cleaning build directory...');
  cleanDirs();

  console.log('2. Copying dist files...');
  copyDist();

  console.log('3. Modifying manifest for', BUILD_TYPE, '...');
  modifyManifest();

  console.log('4. Creating default settings...');
  createDefaultSettings();

  console.log('5. Creating zip package...');
  createZip();

  console.log('\nBuild complete!');
  console.log(`Output: build/ folder and tuneport-${BUILD_TYPE}-*.zip`);
}

main().catch(console.error);
