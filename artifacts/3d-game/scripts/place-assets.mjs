/**
 * Places icon + splash PNGs into Android and iOS native project folders.
 * Uses the locally-installed sharp@0.34.x (has Windows prebuilt binary).
 * Run: node scripts/place-assets.mjs
 */

import sharp from 'sharp';
import { mkdirSync, copyFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root      = join(__dirname, '..');
const srcIcon   = join(root, 'assets-source', 'icon.png');
const srcSplash = join(root, 'assets-source', 'splash.png');

async function resize(src, dest, width, height) {
  mkdirSync(dirname(dest), { recursive: true });
  await sharp(src).resize(width, height).png().toFile(dest);
  console.log(`  ✓ ${dest.replace(root, '').replace(/\\/g, '/')}`);
}

// ─── Android icons ────────────────────────────────────────────────────────
const androidRes = join(root, 'android/app/src/main/res');

const androidSizes = [
  ['mipmap-mdpi',    48],
  ['mipmap-hdpi',    72],
  ['mipmap-xhdpi',   96],
  ['mipmap-xxhdpi',  144],
  ['mipmap-xxxhdpi', 192],
];

console.log('\n🤖 Android icons:');
for (const [folder, size] of androidSizes) {
  const dir = join(androidRes, folder);
  await resize(srcIcon, join(dir, 'ic_launcher.png'),       size, size);
  await resize(srcIcon, join(dir, 'ic_launcher_round.png'), size, size);
  await resize(srcIcon, join(dir, 'ic_launcher_foreground.png'), size, size);
}

// Play Store hi-res icon (512×512)
const playStoreDir = join(root, 'assets-source');
await resize(srcIcon, join(playStoreDir, 'play-store-icon-512.png'), 512, 512);
console.log('  ✓ assets-source/play-store-icon-512.png  ← upload this to Google Play Console');

// Android splash screen (placed in drawable folders)
console.log('\n🤖 Android splash:');
const splashSizes = [
  ['drawable',       480, 800],
  ['drawable-land',  800, 480],
  ['drawable-port',  320, 480],
  ['drawable-hdpi',  480, 800],
  ['drawable-xhdpi', 720, 1280],
  ['drawable-xxhdpi',960, 1600],
  ['drawable-xxxhdpi',1280,1920],
];
for (const [folder, w, h] of splashSizes) {
  await resize(srcSplash, join(androidRes, folder, 'splash.png'), w, h);
}

// ─── iOS icons ────────────────────────────────────────────────────────────
const iosIconSet = join(root, 'ios/App/App/Assets.xcassets/AppIcon.appiconset');
mkdirSync(iosIconSet, { recursive: true });

const iosSizes = [
  ['Icon-20.png',           20],
  ['Icon-20@2x.png',        40],
  ['Icon-20@3x.png',        60],
  ['Icon-29.png',           29],
  ['Icon-29@2x.png',        58],
  ['Icon-29@3x.png',        87],
  ['Icon-40.png',           40],
  ['Icon-40@2x.png',        80],
  ['Icon-40@3x.png',        120],
  ['Icon-60@2x.png',        120],
  ['Icon-60@3x.png',        180],
  ['Icon-76.png',           76],
  ['Icon-76@2x.png',        152],
  ['Icon-83.5@2x.png',      167],
  ['Icon-1024.png',         1024],
];

console.log('\n🍎 iOS icons:');
for (const [name, size] of iosSizes) {
  await resize(srcIcon, join(iosIconSet, name), size, size);
}

// Write Contents.json for Xcode
const contentsJson = {
  images: [
    { size:'20x20',   idiom:'iphone', scale:'2x', filename:'Icon-20@2x.png' },
    { size:'20x20',   idiom:'iphone', scale:'3x', filename:'Icon-20@3x.png' },
    { size:'29x29',   idiom:'iphone', scale:'1x', filename:'Icon-29.png' },
    { size:'29x29',   idiom:'iphone', scale:'2x', filename:'Icon-29@2x.png' },
    { size:'29x29',   idiom:'iphone', scale:'3x', filename:'Icon-29@3x.png' },
    { size:'40x40',   idiom:'iphone', scale:'2x', filename:'Icon-40@2x.png' },
    { size:'40x40',   idiom:'iphone', scale:'3x', filename:'Icon-40@3x.png' },
    { size:'60x60',   idiom:'iphone', scale:'2x', filename:'Icon-60@2x.png' },
    { size:'60x60',   idiom:'iphone', scale:'3x', filename:'Icon-60@3x.png' },
    { size:'20x20',   idiom:'ipad',   scale:'1x', filename:'Icon-20.png' },
    { size:'20x20',   idiom:'ipad',   scale:'2x', filename:'Icon-20@2x.png' },
    { size:'29x29',   idiom:'ipad',   scale:'1x', filename:'Icon-29.png' },
    { size:'29x29',   idiom:'ipad',   scale:'2x', filename:'Icon-29@2x.png' },
    { size:'40x40',   idiom:'ipad',   scale:'1x', filename:'Icon-40.png' },
    { size:'40x40',   idiom:'ipad',   scale:'2x', filename:'Icon-40@2x.png' },
    { size:'76x76',   idiom:'ipad',   scale:'1x', filename:'Icon-76.png' },
    { size:'76x76',   idiom:'ipad',   scale:'2x', filename:'Icon-76@2x.png' },
    { size:'83.5x83.5',idiom:'ipad',  scale:'2x', filename:'Icon-83.5@2x.png' },
    { size:'1024x1024',idiom:'ios-marketing', scale:'1x', filename:'Icon-1024.png' },
  ],
  info: { version: 1, author: 'memory-hoops' },
};
import { writeFileSync } from 'fs';
writeFileSync(join(iosIconSet, 'Contents.json'), JSON.stringify(contentsJson, null, 2));
console.log('  ✓ Contents.json written for Xcode');

// iOS splash screens
const iosSplash = join(root, 'ios/App/App/Assets.xcassets/Splash.imageset');
mkdirSync(iosSplash, { recursive: true });
console.log('\n🍎 iOS splash:');
await resize(srcSplash, join(iosSplash, 'splash.png'),    750, 1334);
await resize(srcSplash, join(iosSplash, 'splash@2x.png'), 1242,2208);
await resize(srcSplash, join(iosSplash, 'splash@3x.png'), 1284,2778);

const splashContents = {
  images: [
    { idiom:'universal', scale:'1x', filename:'splash.png' },
    { idiom:'universal', scale:'2x', filename:'splash@2x.png' },
    { idiom:'universal', scale:'3x', filename:'splash@3x.png' },
  ],
  info: { version: 1, author: 'memory-hoops' },
};
writeFileSync(join(iosSplash, 'Contents.json'), JSON.stringify(splashContents, null, 2));
console.log('  ✓ iOS splash Contents.json written');

console.log('\n✅ All assets placed successfully!');
console.log('   Run: npx cap sync  to push updates to native projects');
