import fs from 'fs';
import path from 'path';
import sharp from 'sharp';

async function generate() {
  const svgPath = path.resolve('public/icon.svg');
  const svgBuffer = fs.readFileSync(svgPath);

  const outDir = path.resolve('public');
  const distDir = path.resolve('dist');

  console.log('Generating PWA icons from SVG with sharp...');

  // 1. 512x512 standard PWA icon
  const pwa512 = await sharp(svgBuffer).resize(512, 512).png().toBuffer();
  fs.writeFileSync(path.join(outDir, 'pwa-512x512.png'), pwa512);

  // 2. 192x192 standard PWA icon
  const pwa192 = await sharp(svgBuffer).resize(192, 192).png().toBuffer();
  fs.writeFileSync(path.join(outDir, 'pwa-192x192.png'), pwa192);

  // 3. Apple Touch Icon (180x180)
  const appleTouch = await sharp(svgBuffer).resize(180, 180).png().toBuffer();
  fs.writeFileSync(path.join(outDir, 'apple-touch-icon.png'), appleTouch);

  // 4. Favicon (64x64)
  const favicon = await sharp(svgBuffer).resize(64, 64).png().toBuffer();
  fs.writeFileSync(path.join(outDir, 'favicon.ico'), favicon);

  // 5. Maskable Icon (512x512 with safe padding)
  // Maskable icons require ~10% safe zone padding around the core graphics
  const innerSize = Math.round(512 * 0.82);
  const innerBuffer = await sharp(svgBuffer).resize(innerSize, innerSize).png().toBuffer();
  const maskable = await sharp({
    create: {
      width: 512,
      height: 512,
      channels: 4,
      background: { r: 30, g: 27, b: 75, alpha: 1 } // #1e1b4b deep indigo background
    }
  })
    .composite([{ input: innerBuffer, gravity: 'center' }])
    .png()
    .toBuffer();
  fs.writeFileSync(path.join(outDir, 'pwa-maskable-512x512.png'), maskable);

  // If dist exists, also sync icons there
  if (fs.existsSync(distDir)) {
    fs.copyFileSync(path.join(outDir, 'icon.svg'), path.join(distDir, 'icon.svg'));
    fs.copyFileSync(path.join(outDir, 'pwa-512x512.png'), path.join(distDir, 'pwa-512x512.png'));
    fs.copyFileSync(path.join(outDir, 'pwa-192x192.png'), path.join(distDir, 'pwa-192x192.png'));
    fs.copyFileSync(path.join(outDir, 'apple-touch-icon.png'), path.join(distDir, 'apple-touch-icon.png'));
    fs.copyFileSync(path.join(outDir, 'favicon.ico'), path.join(distDir, 'favicon.ico'));
    fs.copyFileSync(path.join(outDir, 'pwa-maskable-512x512.png'), path.join(distDir, 'pwa-maskable-512x512.png'));
  }

  console.log('✅ Successfully generated all icons!');
}

generate().catch(err => {
  console.error('Error generating icons:', err);
  process.exit(1);
});
