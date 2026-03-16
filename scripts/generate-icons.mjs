import sharp from 'sharp';
import { mkdirSync } from 'fs';

const SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" rx="80" fill="#1e3a5f"/>
  <circle cx="256" cy="220" r="110" fill="none" stroke="#d4a017" stroke-width="20"/>
  <text x="256" y="250" text-anchor="middle" font-family="Arial,sans-serif" font-size="120" font-weight="bold" fill="#d4a017">K</text>
  <rect x="140" y="360" width="232" height="30" rx="15" fill="#d4a017" opacity="0.6"/>
</svg>`;

const sizes = [72, 96, 128, 144, 152, 192, 384, 512];

mkdirSync('public/icons', { recursive: true });

for (const size of sizes) {
  await sharp(Buffer.from(SVG))
    .resize(size, size)
    .png()
    .toFile(`public/icons/icon-${size}x${size}.png`);
  console.log(`Generated icon-${size}x${size}.png`);
}

// Apple touch icon
await sharp(Buffer.from(SVG))
  .resize(180, 180)
  .png()
  .toFile('public/apple-touch-icon.png');
console.log('Generated apple-touch-icon.png');

// Also copy 192 and 512 to root public for backwards compat
await sharp(Buffer.from(SVG)).resize(192, 192).png().toFile('public/icon-192x192.png');
await sharp(Buffer.from(SVG)).resize(512, 512).png().toFile('public/icon-512x512.png');
console.log('Done!');
