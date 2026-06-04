import { execSync as exec } from 'node:child_process';
import { existsSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { deflateSync } from 'node:zlib'; // Wait, let's keep the rest the same

import { fileURLToPath } from 'node:url';

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const MAP = {
  'AI_TeleSuite.app': 'AI-TeleSuite/public/favicon.png',
  'Anchit Tandon — Portfolio.app': 'Anchit-Work-Portfolio/favicon.png',
  'Hey Yaara.app': 'hey-yaara/public/favicon.png',
  'MuseVibe Studio.app': 'MusicGenAI/public/favicon.png',
  'The Third Eye.app': 'The-Third-Eye/frontend/public/logo.png',
  'VAHDAM DTC — Metric Intelligence Guide.app': 'vahdam_dtc_data_engine/favicon.png',
  'VAHDAM® Mailer Studio.app': 'marketing_mailers__html_architect/favicon.png'
};

function makeIcns(pngPath, outIcnsPath) {
  const iconsetDir = resolve(ROOT, 'tmp.iconset');
  if (existsSync(iconsetDir)) {
    rmSync(iconsetDir, { recursive: true, force: true });
  }
  mkdirSync(iconsetDir);

  const sizes = [
    [16, 'icon_16x16.png'],
    [32, 'icon_16x16@2x.png'],
    [32, 'icon_32x32.png'],
    [64, 'icon_32x32@2x.png'],
    [128, 'icon_128x128.png'],
    [256, 'icon_128x128@2x.png'],
    [256, 'icon_256x256.png'],
    [512, 'icon_256x256@2x.png'],
    [512, 'icon_512x512.png'],
    [1024, 'icon_512x512@2x.png']
  ];

  for (const [size, name] of sizes) {
    const dest = resolve(iconsetDir, name);
    exec(`sips -z ${size} ${size} "${pngPath}" --out "${dest}" > /dev/null 2>&1`);
  }

  // Compile to icns
  exec(`iconutil -c icns "${iconsetDir}" -o "${outIcnsPath}" > /dev/null 2>&1`);

  // Clean up
  rmSync(iconsetDir, { recursive: true, force: true });
}

console.log('Generating macOS app bundle icons...');

for (const [appFolder, pngRelative] of Object.entries(MAP)) {
  const appPath = resolve(ROOT, appFolder);
  const pngPath = resolve(ROOT, pngRelative);

  if (!existsSync(appPath)) {
    console.warn(`App not found: ${appFolder}`);
    continue;
  }
  if (!existsSync(pngPath)) {
    console.warn(`Source PNG not found for ${appFolder}: ${pngRelative}`);
    continue;
  }

  const icnsPath = resolve(appPath, 'Contents/Resources/app.icns');
  console.log(`Updating ${appFolder} icon using ${pngRelative}...`);
  try {
    makeIcns(pngPath, icnsPath);
    // Touch the app bundle so Finder updates its cache
    exec(`touch "${appPath}"`);
    console.log(`✅ Updated ${appFolder}`);
  } catch (err) {
    console.error(`❌ Failed to update ${appFolder}:`, err);
  }
}

console.log('Refreshing Finder and Dock...');
try {
  exec('killall Finder && killall Dock');
  console.log('✅ Refreshed macOS UI caches.');
} catch {}

console.log('All icons processed.');
