# 🌾 Bhoomi — Agriculture Website + Admin CMS

A modern, minimal agriculture website with a cinematic animated hero, scroll effects, Unsplash imagery, and a **full admin panel** to manage content, theme, and API integrations. You don't have to touch any code.

![stack](https://img.shields.io/badge/Node.js-18%2B-1f3d2b) ![deps](https://img.shields.io/badge/dependencies-3-d9a441)

## Quick start

```bash
npm install
npm start
```

- Website → http://localhost:3000
- Admin → http://localhost:3000/admin
- Default login: **admin / admin123** (the dashboard asks you to change it right away)

You can set your own login before the first run:

```bash
ADMIN_USER=owner ADMIN_PASSWORD='a-strong-password' npm start
```

## Website features

| Section | Effect |
| --- | --- |
| **Preloader** | The brand name rises letter by letter with a counter, then the curtain lifts |
| **Hero** (3 styles) | Full-screen slideshow with clip-path wipes, Ken Burns zoom and mouse parallax. The headline reveals word by word, with glass badges and a live weather chip. On scroll, the frame shrinks into a rounded card |
| Marquee | Infinite crop ticker that speeds up and changes direction with scroll velocity |
| About | A large statement that lights up word by word as you scroll, plus parallax images |
| Stats | Animated counters |
| Services | Sticky cards that stack as you scroll |
| Process | Pinned horizontal-scroll timeline |
| Products | Category filters, hover zoom, and an "Order on WhatsApp" button |
| Live data | Weather card and your custom API cards |
| Gallery | Three-column parallax masonry with a lightbox |
| Testimonials, Journal, FAQ, CTA (clip-expand), Contact + newsletter, giant footer | |

Also included: smooth inertia scrolling (Lenis), a custom cursor, magnetic buttons, a film-grain texture, a scroll progress bar, a hide-on-scroll header, a full-screen mobile menu, and support for `prefers-reduced-motion`.

## Admin panel (CMS)

- **Pages & sections**: add, duplicate, delete, show/hide, and drag to reorder any of the 14 section types. Every text, image, list item and button can be edited. Wrap words in `*asterisks*` to highlight them in the accent colour.
- **Live preview**: an instant desktop or mobile preview of unsaved changes, shown next to the editor.
- **Theme & design**: 5 presets (Harvest, Terracotta, Midnight Field, Fresh Sprout, Monsoon), 8 colour pickers, heading and body Google Fonts, corner radius, hero style, animation level, toggles (smooth scroll, cursor, grain, preloader), and custom CSS.
- **Site settings**: brand, logo, favicon, announcement bar, navigation menu, SEO and OG image, contact details, Google Maps embed, social links, footer.
- **Media library**: drag-and-drop uploads, **Unsplash search** (after you add an API key), add images by URL, and a picker inside every image field.
- **Integrations & APIs** (keys stay on the server and are never sent to visitors):
  - Weather: Open-Meteo works without a key, or use OpenWeatherMap
  - Google Analytics 4
  - Unsplash
  - WhatsApp chat and ordering
  - Webhook (Zapier, Make, n8n, CRM) with HMAC signing
  - reCAPTCHA v3
  - Custom `<head>` and `<body>` code
  - **Custom APIs**: connect any JSON API (for example, mandi prices from data.gov.in). You set the method, headers, body, an `{{apiKey}}` placeholder, caching, and which fields to show. A **Test** button lets you check it. Public APIs appear as cards on the website through a secure server proxy.
- **Messages** inbox, **subscribers** with CSV export, **account** (username and password), and **backup / restore / reset**.

## Project structure

```
server.js            Express server: public API, admin API, proxy for weather/custom APIs, SEO meta injection
lib/defaults.js      Seed content + theme presets
lib/db.js            JSON-file datastore (data/db.json, atomic writes)
lib/auth.js          scrypt passwords + HMAC-signed session cookie
public/index.html    Site shell
public/css/site.css  Site styles (all colours/fonts come from theme variables)
public/js/site.js    Section renderers + all animations
public/admin/        Admin SPA (schema-driven forms)
data/                Your content (git-ignored) — back it up!
uploads/             Uploaded images (git-ignored)
```

## Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | `3000` | HTTP port |
| `ADMIN_USER` / `ADMIN_PASSWORD` | `admin` / `admin123` | First admin account (used only if no user exists yet) |
| `SESSION_SECRET` | auto-generated in `data/.secret` | Cookie signing secret |
| `DATA_DIR` / `UPLOAD_DIR` | `./data`, `./uploads` | Storage locations (point these at a persistent volume in production) |
| `NODE_ENV=production` | – | Enables `Secure` cookies (requires HTTPS) |

## Deployment

The app runs on any host that keeps a persistent disk, for example a VPS, Render or Railway with a volume, or Docker. Point `DATA_DIR` and `UPLOAD_DIR` at the persistent volume and put the app behind HTTPS. Serverless hosts with read-only filesystems are not a good fit, because the CMS writes to disk.
