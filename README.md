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

## Design

The design follows Apple's design principles: content first, generous white space, one clear message per section, and motion that supports the story.

- **Type**: the system UI font (SF Pro on Apple devices, Segoe/Roboto elsewhere) with bold, tight headlines. Words wrapped in `*asterisks*` get a quiet colour gradient.
- **Hero**: three styles.
  - *Product* (default): a centred headline; as you scroll, the framed photo grows to full-bleed.
  - *Split*: the headline beside a framed photo.
  - *Immersive*: a full-screen photo with the text on top.
- **Sections**:

| Section | Layout |
| --- | --- |
| Crop strip | Slow, faded ticker of what you grow |
| About | Statement that lights up word by word as you scroll, photo tiles, three key points |
| Stats | Number tiles with gradient figures and count-up animation |
| Services | **Bento grid** (large, small, small, wide tiles) |
| Process | **Sticky scrollytelling**: steps scroll on one side while the photo changes on the other |
| Products | Apple Store-style **shelf** with a segmented filter, arrow buttons and Buy/Enquire buttons |
| Live data | Weather tile and custom API cards |
| Gallery | Centred carousel with a pager and play/pause button |
| Testimonials, Journal, FAQ | Testimonials as one large quote at a time, journal as cards, FAQ as an accordion |
| CTA | Tile with the text above and a photo below |
| Contact | Floating-label form and newsletter signup |
| Footer | Quiet Apple-style footer |

- **Presets**: Orchard (default), Graphite (dark), Harvest, Monsoon and Soil. Colours, fonts and corner radius stay fully editable.

## Pages

| URL | What it is |
| --- | --- |
| `/` | Homepage built from CMS sections |
| `/products`, `/products/:slug` | Shop with search, filters and sorting; product page with photos, MRP and discount, stock, quantity, pincode check and related items |
| `/cart`, `/checkout`, `/order/:number`, `/track` | Cart, checkout (Razorpay or cash on delivery), order confirmation with a status timeline, and order tracking by order number + phone |
| `/account` | Customer sign-up and sign-in, plus order history |
| `/blog`, `/blog/:slug` | Journal with categories, search, tags and reading time |
| `/services/:slug` | A detail page for each service in the bento grid |
| `/farmers` | Farmer programme with three forms: registration, soil-test booking and call-back request |
| `/mandi` | Live APMC mandi prices from data.gov.in, filterable by state, district and commodity |
| `/advisory` | Crop calendar (Kharif/Rabi/Zaid), field advisories and government schemes |
| `/about`, `/careers`, `/contact`, `/bulk` | About and team, jobs with an application form, contact, and a B2B bulk-quote form |
| `/privacy-policy`, `/terms`, `/refund-policy`, `/shipping-policy` | Legal page templates. **Have a lawyer review them before you go live.** |

Every URL gets its own title, description, share image and canonical tag from the server. Products and articles also get JSON-LD structured data. `sitemap.xml` and `robots.txt` are generated automatically.

### Languages

The site supports English, हिन्दी, मराठी and தமிழ். Buttons, forms and shop text are translated out of the box. To translate your own content, pick **Translating: Hindi** at the top of any admin content page; images, prices and links stay shared across languages. Visitors switch language from the globe icon. The built-in translations were written by AI, so ask a native speaker to review them.

### Slow networks

- Responsive images (`srcset`) with lazy loading
- Data Saver and 2G/3G connections get smaller images and less motion
- gzip compression
- A service worker (over HTTPS) caches the site for fast repeat visits and basic offline use
- Installable as a PWA (`manifest.webmanifest`)

## Admin panel (CMS)

- **Content**: homepage sections (drag to reorder), pages, blog (Markdown editor) and media library. Everything is translatable.
- **Shop**:
  - **Products**: price, MRP, stock, photos, featured and visible toggles.
  - **Orders**: filter by status, update the status with a note (the customer sees it on the tracking page), WhatsApp the customer, export CSV. Cancelling an order puts the stock back.
  - **Customers**: list of customer accounts.
  - **Shop settings**: delivery fee, free-delivery threshold, minimum order, COD, and serviceable pincodes (exact, `422*` prefix, or `400001-400104` range).
- **Farmers & company**:
  - **Requests & leads**: farmer registrations, soil tests, call-backs, bulk quotes and job applications, with status, notes, call/WhatsApp buttons and CSV export.
  - **Crop calendar, advisories and schemes**.
  - **Team and jobs**.
- **Settings**: theme, site and languages, navigation, SEO, integrations, messages, subscribers, account, backup.
- **Live preview** for content, theme and shop pages, on desktop or mobile, before you save.

### Integrations (keys stay on the server)

| Integration | How to set it up |
| --- | --- |
| **Razorpay** | Add the Key ID and Key Secret in Integrations, then click *Test connection*. Payments are verified server-side with an HMAC signature. Start with `rzp_test_` keys. |
| **Mandi prices** | Get a free API key at [data.gov.in](https://data.gov.in). The default key is data.gov.in's public sample key, which returns only a few rows. |
| Weather | Open-Meteo works without a key; OpenWeatherMap needs one. |
| Others | Google Analytics 4, Unsplash, WhatsApp, webhooks (contact, lead, order and payment events, with HMAC signing), reCAPTCHA v3, custom `<head>`/`<body>` code, and custom JSON APIs. |

## Project structure

```
server.js            Express server: public API, admin API, proxy for weather/custom APIs, SEO meta injection
lib/defaults.js      Seed content + theme presets
lib/db.js            JSON-file datastore (data/db.json, atomic writes)
lib/auth.js          scrypt passwords + HMAC-signed session cookie
public/index.html    Site shell
public/css/site.css  Site styles (all colours/fonts come from theme variables)
public/js/i18n.js    Interface strings (en/hi/mr/ta) + content localisation
public/js/core.js    Helpers: images, markdown, cart, forms
public/js/sections.js Homepage section renderers
public/js/pages.js   Route views (shop, checkout, blog, farmers, mandi…)
public/js/app.js     Router, nav/footer, motion, live preview
public/sw.js         Service worker (offline / repeat visits)
lib/shop.js          Pricing, pincodes, orders, Razorpay
lib/mandi.js         data.gov.in mandi prices
lib/content.js       Seed catalogue, blog, pages, crops, schemes
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
