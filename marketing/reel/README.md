# Bhoomi — Instagram Reel

A 27.5-second, 1080×1920, 30 fps reel showcasing the website. It uses Instrument Serif and Inter Tight, with Noto Serif for Hindi, Marathi and Tamil text, and After Effects-style motion: masked text reveals, circle and wipe transitions, a hero image that shrinks into a phone, a 3D card fan, a language morph, film grain and a vignette.

## Render it yourself (with the real Unsplash photos)

```bash
# 1. Start the website in another terminal
npm start

# 2. From marketing/reel/
npm i -D playwright && npx playwright install chromium   # one time
REAL_PHOTOS=1 node capture.js http://localhost:3000      # screenshots + scroll clip → assets/
node render.js                                           # → out/bhoomi-reel.mp4 + cover
```

You also need `ffmpeg` installed. If you leave out `REAL_PHOTOS=1`, brand-coloured illustrations replace the photos. The mandi and weather numbers shown in the reel are sample data.

- **Watch the animation live:** open `reel.html` in Chrome after running `capture.js`.
- **Render still previews:** `node render.js 3.5 12 20` saves stills at those seconds.

## Scenes

| Time | Scene |
| --- | --- |
| 0–3 s | Intro |
| 2.6–6.4 s | Hero: “Food, grown right.” |
| 5.5–10.6 s | Phone scroll and feature chips |
| 10.2–14.4 s | Shop |
| 14–17.8 s | Four languages |
| 17.4–21 s | Farmer tools |
| 20.6–24 s | Admin CMS |
| 23.6–27.5 s | Outro: “Link in bio” |
