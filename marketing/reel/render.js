// Renders reel.html frame-by-frame and encodes an Instagram-ready MP4 (1080×1920, 30 fps, H.264).
// Usage: node render.js            (needs Playwright + ffmpeg; run capture.js first)
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');
const { chromium } = require(process.env.PLAYWRIGHT || 'playwright');

const FPS = 30;
const FRAMES = path.join(__dirname, 'frames');
const OUT = path.join(__dirname, 'out');
const only = process.argv.slice(2).map(Number).filter((n) => !Number.isNaN(n)); // optional: preview seconds

(async () => {
  fs.rmSync(FRAMES, { recursive: true, force: true });
  fs.mkdirSync(FRAMES, { recursive: true });
  fs.mkdirSync(OUT, { recursive: true });
  const browser = await chromium.launch();
  const page = await browser.newPage({ viewport: { width: 1080, height: 1920 }, deviceScaleFactor: 1 });
  await page.goto('file://' + path.join(__dirname, 'reel.html'));
  await page.evaluate(() => window.ready);
  const duration = await page.evaluate(() => window.DURATION);

  if (only.length) {
    for (const t of only) {
      await page.evaluate((tt) => window.seek(tt), t);
      await page.screenshot({ path: path.join(OUT, `preview-${t}s.jpg`), type: 'jpeg', quality: 90 });
    }
    console.log('previews written to out/');
    await browser.close();
    return;
  }

  const total = Math.round(duration * FPS);
  for (let f = 0; f < total; f++) {
    await page.evaluate(([t, fr]) => window.seek(t, fr), [f / FPS, f]);
    await page.screenshot({ path: path.join(FRAMES, `${String(f).padStart(4, '0')}.jpg`), type: 'jpeg', quality: 95 });
    if (f % 60 === 0) console.log(`frame ${f}/${total}`);
  }
  // Poster frame for the reel cover
  await page.evaluate(() => window.seek(4.6, 138));
  await page.screenshot({ path: path.join(OUT, 'bhoomi-reel-cover.jpg'), type: 'jpeg', quality: 95 });
  await browser.close();

  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-framerate', String(FPS), '-i', path.join(FRAMES, '%04d.jpg'),
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-level', '4.2',
    '-movflags', '+faststart', path.join(OUT, 'bhoomi-reel.mp4')], { stdio: 'inherit' });
  console.log('✓ out/bhoomi-reel.mp4');
})().catch((e) => { console.error(e); process.exit(1); });
