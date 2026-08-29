/**
 * Memory Hoops — app icon + splash screen generator
 * Uses SVG → sharp → PNG (no native canvas compilation needed)
 * Run: node scripts/generate-assets.mjs
 */

import sharp from 'sharp';
import { writeFileSync, mkdirSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));
const root      = join(__dirname, '..');
const outDir    = join(root, 'assets-source');
mkdirSync(outDir, { recursive: true });

// ─── App Icon SVG (1024×1024) ────────────────────────────────────────────
const iconSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">
  <defs>
    <!-- Background radial gradient -->
    <radialGradient id="bgGrad" cx="50%" cy="48%" r="62%">
      <stop offset="0%"   stop-color="#3c1c05"/>
      <stop offset="100%" stop-color="#0d0905"/>
    </radialGradient>

    <!-- Ball body gradient -->
    <radialGradient id="ballGrad" cx="36%" cy="34%" r="65%">
      <stop offset="0%"   stop-color="#f5a040"/>
      <stop offset="45%"  stop-color="#d4620e"/>
      <stop offset="100%" stop-color="#7a2e00"/>
    </radialGradient>

    <!-- Ball specular highlight -->
    <radialGradient id="specGrad" cx="30%" cy="28%" r="45%">
      <stop offset="0%"   stop-color="rgba(255,230,180,0.55)"/>
      <stop offset="100%" stop-color="rgba(255,230,180,0)"/>
    </radialGradient>

    <!-- Ball edge shadow -->
    <radialGradient id="edgeShadow" cx="50%" cy="50%" r="50%">
      <stop offset="70%"  stop-color="rgba(0,0,0,0)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0.52)"/>
    </radialGradient>

    <!-- Outer glow -->
    <radialGradient id="glowGrad" cx="50%" cy="50%" r="50%">
      <stop offset="0%"   stop-color="rgba(224,124,36,0.45)"/>
      <stop offset="50%"  stop-color="rgba(224,124,36,0.15)"/>
      <stop offset="100%" stop-color="rgba(224,124,36,0)"/>
    </radialGradient>

    <filter id="letterGlow" x="-30%" y="-30%" width="160%" height="160%">
      <feGaussianBlur stdDeviation="8" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="rimGlow" x="-20%" y="-20%" width="140%" height="140%">
      <feGaussianBlur stdDeviation="5" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="1024" height="1024" fill="url(#bgGrad)"/>

  <!-- Ball outer glow halo -->
  <circle cx="512" cy="482" r="360" fill="url(#glowGrad)"/>

  <!-- Basketball body -->
  <circle cx="512" cy="482" r="298" fill="url(#ballGrad)"/>
  <circle cx="512" cy="482" r="298" fill="url(#specGrad)"/>

  <!-- Seam lines -->
  <g stroke="#1a0600" stroke-width="13" fill="none" stroke-linecap="round">
    <!-- Horizontal seam (top half arc) -->
    <path d="M 214 482 A 298 298 0 0 1 810 482"/>
    <!-- Vertical seam (right half arc) -->
    <path d="M 512 184 A 298 298 0 0 1 512 780"/>
    <!-- Left curve seam -->
    <path d="M 512 184 C 348 314 348 650 512 780"/>
    <!-- Right curve seam -->
    <path d="M 512 184 C 676 314 676 650 512 780"/>
  </g>

  <!-- Ball edge shadow -->
  <circle cx="512" cy="482" r="298" fill="url(#edgeShadow)"/>

  <!-- Rim accent arc below ball -->
  <path d="M 322 728 A 195 195 0 0 0 702 728"
        stroke="#e07c24" stroke-width="12" fill="none"
        stroke-linecap="round" opacity="0.55"
        filter="url(#rimGlow)"/>

  <!-- HORSE letters in arc -->
  <g font-family="Arial Black, Arial, sans-serif" font-weight="900"
     font-size="97" fill="#f5a623" text-anchor="middle" dominant-baseline="middle"
     filter="url(#letterGlow)">
    <!-- H  angle ~112° -->
    <text x="263" y="714">H</text>
    <!-- O  angle ~124° -->
    <text x="349" y="779">O</text>
    <!-- R  angle ~140° -->
    <text x="474" y="812">R</text>
    <!-- S  angle ~156° -->
    <text x="604" y="779">S</text>
    <!-- E  angle ~168° -->
    <text x="693" y="714">E</text>
  </g>
</svg>`;

// ─── Splash Screen SVG (2732×2732) ───────────────────────────────────────
const splashSvg = `<svg xmlns="http://www.w3.org/2000/svg" width="2732" height="2732" viewBox="0 0 2732 2732">
  <defs>
    <radialGradient id="sbg" cx="50%" cy="44%" r="60%">
      <stop offset="0%"   stop-color="#3c1c05"/>
      <stop offset="70%"  stop-color="#140802"/>
      <stop offset="100%" stop-color="#0d0905"/>
    </radialGradient>
    <radialGradient id="sball" cx="36%" cy="34%" r="65%">
      <stop offset="0%"   stop-color="#f5a040"/>
      <stop offset="45%"  stop-color="#d4620e"/>
      <stop offset="100%" stop-color="#7a2e00"/>
    </radialGradient>
    <radialGradient id="sspec" cx="30%" cy="28%" r="45%">
      <stop offset="0%"   stop-color="rgba(255,230,180,0.5)"/>
      <stop offset="100%" stop-color="rgba(255,230,180,0)"/>
    </radialGradient>
    <radialGradient id="sedge" cx="50%" cy="50%" r="50%">
      <stop offset="68%"  stop-color="rgba(0,0,0,0)"/>
      <stop offset="100%" stop-color="rgba(0,0,0,0.5)"/>
    </radialGradient>
    <radialGradient id="sglow" cx="50%" cy="50%" r="50%">
      <stop offset="0%"   stop-color="rgba(224,124,36,0.4)"/>
      <stop offset="55%"  stop-color="rgba(224,124,36,0.12)"/>
      <stop offset="100%" stop-color="rgba(224,124,36,0)"/>
    </radialGradient>
    <radialGradient id="sfloor" cx="50%" cy="0%" r="100%">
      <stop offset="0%"   stop-color="rgba(224,124,36,0.18)"/>
      <stop offset="100%" stop-color="rgba(224,124,36,0)"/>
    </radialGradient>
    <filter id="sglow2" x="-40%" y="-40%" width="180%" height="180%">
      <feGaussianBlur stdDeviation="18" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <filter id="titleGlow" x="-10%" y="-40%" width="120%" height="180%">
      <feGaussianBlur stdDeviation="28" result="blur"/>
      <feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>

  <!-- Background -->
  <rect width="2732" height="2732" fill="#0d0905"/>
  <rect width="2732" height="2732" fill="url(#sbg)"/>

  <!-- Subtle perspective grid on floor -->
  <g stroke="#f5a623" stroke-width="2.5" opacity="0.07">
    <!-- Converging lines to vanishing point (1366, 1040) -->
    <line x1="1366" y1="1040" x2="0"    y2="1968"/>
    <line x1="1366" y1="1040" x2="205"  y2="1968"/>
    <line x1="1366" y1="1040" x2="410"  y2="1968"/>
    <line x1="1366" y1="1040" x2="614"  y2="1968"/>
    <line x1="1366" y1="1040" x2="819"  y2="1968"/>
    <line x1="1366" y1="1040" x2="1024" y2="1968"/>
    <line x1="1366" y1="1040" x2="1229" y2="1968"/>
    <line x1="1366" y1="1040" x2="1366" y2="1968"/>
    <line x1="1366" y1="1040" x2="1503" y2="1968"/>
    <line x1="1366" y1="1040" x2="1708" y2="1968"/>
    <line x1="1366" y1="1040" x2="1913" y2="1968"/>
    <line x1="1366" y1="1040" x2="2118" y2="1968"/>
    <line x1="1366" y1="1040" x2="2322" y2="1968"/>
    <line x1="1366" y1="1040" x2="2527" y2="1968"/>
    <line x1="1366" y1="1040" x2="2732" y2="1968"/>
    <!-- Horizontal rows -->
    <line x1="546"  y1="1312" x2="2186" y2="1312"/>
    <line x1="273"  y1="1480" x2="2459" y2="1480"/>
    <line x1="0"    y1="1648" x2="2732" y2="1648"/>
    <line x1="0"    y1="1816" x2="2732" y2="1816"/>
    <line x1="0"    y1="1968" x2="2732" y2="1968"/>
  </g>

  <!-- Floor glow under ball -->
  <ellipse cx="1366" cy="1632" rx="700" ry="120" fill="url(#sfloor)" opacity="0.6"/>

  <!-- Ball glow halo -->
  <circle cx="1366" cy="1200" r="820" fill="url(#sglow)"/>

  <!-- Basketball -->
  <circle cx="1366" cy="1200" r="600" fill="url(#sball)"/>
  <circle cx="1366" cy="1200" r="600" fill="url(#sspec)"/>

  <!-- Seam lines -->
  <g stroke="#1a0600" stroke-width="26" fill="none" stroke-linecap="round">
    <path d="M 766 1200 A 600 600 0 0 1 1966 1200"/>
    <path d="M 1366 600  A 600 600 0 0 1 1366 1800"/>
    <path d="M 1366 600  C 1034 860  1034 1540 1366 1800"/>
    <path d="M 1366 600  C 1698 860  1698 1540 1366 1800"/>
  </g>

  <!-- Ball edge shadow -->
  <circle cx="1366" cy="1200" r="600" fill="url(#sedge)"/>

  <!-- App title -->
  <text x="1366" y="1970"
        font-family="Arial Black, Arial, sans-serif"
        font-weight="900"
        font-size="195"
        fill="#f5a623"
        text-anchor="middle"
        dominant-baseline="middle"
        filter="url(#titleGlow)">Memory Hoops</text>

  <!-- Tagline -->
  <text x="1366" y="2130"
        font-family="Arial, sans-serif"
        font-weight="600"
        font-size="72"
        fill="rgba(255,255,255,0.32)"
        text-anchor="middle"
        dominant-baseline="middle"
        letter-spacing="18">H · O · R · S · E  BASKETBALL  CHALLENGE</text>
</svg>`;

// ─── Render with sharp ────────────────────────────────────────────────────
console.log('Generating icon.png (1024×1024)...');
await sharp(Buffer.from(iconSvg))
  .png()
  .toFile(join(outDir, 'icon.png'));
console.log('  ✓ assets-source/icon.png');

console.log('Generating splash.png (2732×2732)...');
await sharp(Buffer.from(splashSvg))
  .png()
  .toFile(join(outDir, 'splash.png'));
console.log('  ✓ assets-source/splash.png');

console.log('\n✅ Done! Now run:');
console.log('   npx @capacitor/assets generate --iconBackgroundColor "#0d0905" --splashBackgroundColor "#0d0905" --iconPath assets-source/icon.png --splashPath assets-source/splash.png');
