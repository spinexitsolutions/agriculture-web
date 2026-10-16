// Seed content for a fresh install. Everything here is editable from /admin.
const u = (id, w = 1600) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

const IMG = {
  wheatSunset: 'photo-1500382017468-9049fed747ef',
  tractor: 'photo-1625246333195-78d9c38ad449',
  farmland: 'photo-1464226184884-fa280b87c399',
  wheat: 'photo-1574943320219-553eb213f72d',
  greenhouse: 'photo-1523348837708-15d4a09cfac2',
  seedling: 'photo-1530836369250-ef72a3f5cda8',
  farmSunset: 'photo-1500937386664-56d1dfef3854',
  veggies: 'photo-1592982537447-7440770cbfc9',
  farmerTablet: 'photo-1560493676-04071c5f467b',
  market: 'photo-1542838132-92c53300491e',
  basket: 'photo-1488459716781-31db52582fe9',
  flatlay: 'photo-1498837167922-ddd27525d352',
  greenField: 'photo-1444858291040-58f756a3bdd6',
  plants: 'photo-1416879595882-3373a0480b5b',
  leaves: 'photo-1501004318641-b39e6451bec6',
  strawberry: 'photo-1471193945509-9ad0617afabf',
};

// Apple-inspired palettes. `System` = SF Pro on Apple devices, Segoe/Roboto elsewhere.
const PRESETS = {
  orchard: {
    label: 'Orchard',
    colors: { primary: '#1f7a3a', primaryContrast: '#ffffff', accent: '#7cc142', bg: '#ffffff', surface: '#f5f5f7', text: '#1d1d1f', muted: '#6e6e73', border: '#d2d2d7' },
    fonts: { heading: 'System', body: 'System' },
  },
  graphite: {
    label: 'Graphite (dark)',
    colors: { primary: '#30d158', primaryContrast: '#000000', accent: '#a8e063', bg: '#000000', surface: '#161617', text: '#f5f5f7', muted: '#86868b', border: '#2c2c2e' },
    fonts: { heading: 'System', body: 'System' },
  },
  harvest: {
    label: 'Harvest',
    colors: { primary: '#b55400', primaryContrast: '#ffffff', accent: '#f0a020', bg: '#fbfbf9', surface: '#f2f0eb', text: '#1d1b16', muted: '#6f6a60', border: '#dcd8cf' },
    fonts: { heading: 'Inter Tight', body: 'Inter' },
  },
  monsoon: {
    label: 'Monsoon',
    colors: { primary: '#0071e3', primaryContrast: '#ffffff', accent: '#34c3a0', bg: '#ffffff', surface: '#f5f5f7', text: '#1d1d1f', muted: '#6e6e73', border: '#d2d2d7' },
    fonts: { heading: 'System', body: 'System' },
  },
  soil: {
    label: 'Soil',
    colors: { primary: '#3a5a40', primaryContrast: '#ffffff', accent: '#a3b18a', bg: '#f7f5f0', surface: '#ecebe4', text: '#22261f', muted: '#6b7064', border: '#d6d4c8' },
    fonts: { heading: 'Manrope', body: 'Manrope' },
  },
};

function defaults() {
  return {
    settings: {
      siteName: 'Bhoomi',
      tagline: 'Regenerative farming, rooted in tomorrow',
      logoText: 'Bhoomi',
      logoImage: '',
      favicon: '',
      announcement: { enabled: true, text: 'Kharif harvest is in — fresh, traceable produce now shipping across India.', link: '#products' },
      seo: {
        title: 'Bhoomi — Regenerative Agriculture & Farm-Fresh Produce',
        description: 'Bhoomi works with 2,400+ farmers to grow traceable, chemical-free produce using regenerative, data-driven agriculture.',
        keywords: 'agriculture, organic farming, regenerative, farm fresh, smart farming, India',
        ogImage: u(IMG.wheatSunset, 1200),
      },
      contact: {
        email: 'hello@bhoomi.farm',
        phone: '+91 98765 43210',
        address: 'Plot 14, Agri Innovation Park, Nashik, Maharashtra 422003',
        hours: 'Mon – Sat · 8:00 – 18:00',
        mapEmbed: '',
      },
      social: { instagram: '#', facebook: '#', twitter: '#', youtube: '#', linkedin: '#' },
      footer: {
        bigText: 'Bhoomi',
        text: 'Growing food the way nature intended — with a little help from science.',
        copyright: '© {year} Bhoomi Agritech Pvt. Ltd. All rights reserved.',
      },
    },

    navigation: [
      { label: 'About', href: '#about' },
      { label: 'Services', href: '#services' },
      { label: 'Process', href: '#process' },
      { label: 'Produce', href: '#products' },
      { label: 'Journal', href: '#journal' },
      { label: 'Contact', href: '#contact' },
    ],

    theme: {
      preset: 'orchard',
      ...JSON.parse(JSON.stringify(PRESETS.orchard)),
      radius: 28,
      animations: 'full', // full | reduced | none
      smoothScroll: false,
      heroStyle: 'reveal', // reveal (scroll zoom) | split | minimal (immersive)
      customCss: '',
    },

    sections: [
      {
        id: 'hero', type: 'hero', enabled: true,
        eyebrow: 'Bhoomi Farms',
        title: 'Food, grown *right.*',
        subtitle: 'Regenerative farming and farm-to-door produce from 2,400 farmers who care about the soil as much as the harvest.',
        primaryCta: { label: 'Shop the harvest', href: '#products' },
        secondaryCta: { label: 'Partner with us', href: '#contact' },
        images: [
          { src: u(IMG.wheatSunset, 2400), caption: 'Golden wheat · Punjab' },
          { src: u(IMG.greenField, 2400), caption: 'Monsoon greens · Kerala' },
          { src: u(IMG.tractor, 2400), caption: 'Precision sowing · Nashik' },
          { src: u(IMG.farmSunset, 2400), caption: 'Dusk harvest · Madhya Pradesh' },
        ],
        badges: [
          { value: '2.4k+', label: 'Partner farmers' },
          { value: '38%', label: 'Less water used' },
        ],
        interval: 6,
        showWeather: true,
      },
      {
        id: 'marquee', type: 'marquee', enabled: true,
        items: ['Organic wheat', 'Basmati rice', 'Alphonso mango', 'Turmeric', 'Millets', 'Cold-pressed oils', 'Heirloom tomatoes', 'Pulses'],
        speed: 40,
      },
      {
        id: 'about', type: 'about', enabled: true,
        eyebrow: 'Our approach',
        statement: 'Healthy soil grows healthy food, healthy farmers and healthy communities. We combine centuries of farming wisdom with satellite data, soil science and fair trade to make agriculture regenerative again.',
        image: u(IMG.farmerTablet, 1400),
        imageAlt: 'Farmer checking crop data on a tablet',
        secondaryImage: u(IMG.seedling, 900),
        points: [
          { title: 'Soil first', text: 'Cover cropping, composting and zero-till practices rebuild organic carbon.' },
          { title: 'Fair to farmers', text: 'Guaranteed buy-back prices and 48-hour direct payments.' },
          { title: 'Traceable', text: 'Every pack carries a QR code back to the field it came from.' },
        ],
      },
      {
        id: 'stats', type: 'stats', enabled: true,
        items: [
          { value: 2400, suffix: '+', label: 'Farmers in our network' },
          { value: 18500, suffix: '', label: 'Acres under regenerative care' },
          { value: 38, suffix: '%', label: 'Reduction in water usage' },
          { value: 120, suffix: '+', label: 'Villages reached' },
        ],
      },
      {
        id: 'services', type: 'services', enabled: true,
        eyebrow: 'What we do',
        title: 'Everything a farm needs. *Nothing it doesn’t.*',
        items: [
          { title: 'Precision Agronomy', text: 'Satellite & drone imagery, IoT soil sensors and AI advisories that tell farmers exactly when to sow, water and harvest.', image: u(IMG.tractor, 1400), tag: 'Agronomy' },
          { title: 'Organic Inputs', text: 'Certified bio-fertilisers, neem-based crop protection and heirloom seeds — delivered to the village.', image: u(IMG.seedling, 1400), tag: 'Inputs' },
          { title: 'Smart Greenhouses', text: 'Climate-controlled polyhouses that grow 6× more per square metre with 70% less water.', image: u(IMG.greenhouse, 1400), tag: 'Greenhouses' },
          { title: 'Farm-to-Door Supply', text: 'Cold-chain logistics that take produce from harvest to your kitchen in under 36 hours.', image: u(IMG.market, 1400), tag: 'Supply' },
        ],
      },
      {
        id: 'process', type: 'process', enabled: true,
        eyebrow: 'How it grows',
        title: 'From soil to table. *Step by step.*',
        steps: [
          { title: 'Soil testing', text: 'We map nutrients, pH and moisture for every plot before a single seed is sown.', image: u(IMG.plants, 1200), label: 'Week 0' },
          { title: 'Sowing', text: 'Climate-matched seeds sown with precision drills for even germination.', image: u(IMG.seedling, 1200), label: 'Week 2' },
          { title: 'Nurturing', text: 'Drip irrigation and organic nutrition guided by live sensor data.', image: u(IMG.leaves, 1200), label: 'Week 6' },
          { title: 'Harvest', text: 'Hand-picked at peak ripeness, graded and packed at the farm gate.', image: u(IMG.wheat, 1200), label: 'Week 16' },
          { title: 'To your table', text: 'Cold-chain delivery with full traceability — field to fork.', image: u(IMG.basket, 1200), label: 'Week 17' },
        ],
      },
      {
        id: 'products', type: 'products', enabled: true,
        eyebrow: 'Fresh from the field',
        title: 'The harvest. *Fresh this week.*',
        subtitle: 'Grown without synthetic pesticides, harvested to order.',
        items: [
          { name: 'Heirloom Vegetables Box', category: 'Vegetables', price: '₹ 649', unit: '/ 5 kg', image: u(IMG.veggies, 900), badge: 'Bestseller' },
          { name: 'Stone-ground Wheat Atta', category: 'Grains', price: '₹ 420', unit: '/ 10 kg', image: u(IMG.wheat, 900), badge: '' },
          { name: 'Farm Fresh Strawberries', category: 'Fruits', price: '₹ 299', unit: '/ 500 g', image: u(IMG.strawberry, 900), badge: 'Seasonal' },
          { name: 'Rainbow Harvest Basket', category: 'Vegetables', price: '₹ 899', unit: '/ 8 kg', image: u(IMG.basket, 900), badge: '' },
          { name: 'Market Greens Bundle', category: 'Greens', price: '₹ 249', unit: '/ 2 kg', image: u(IMG.market, 900), badge: 'New' },
          { name: 'Kitchen Garden Starter', category: 'Seeds', price: '₹ 349', unit: '/ kit', image: u(IMG.plants, 900), badge: '' },
        ],
      },
      {
        id: 'live', type: 'live', enabled: true,
        eyebrow: 'Live from the farm',
        title: 'Today in the field.',
        text: 'Real-time conditions from our partner farms. Connect weather and market APIs from the admin panel.',
        showWeather: true,
        apiIds: [],
      },
      {
        id: 'gallery', type: 'gallery', enabled: true,
        eyebrow: 'Life on the farm',
        title: 'Life on the farm.',
        images: [
          { src: u(IMG.farmland, 1000), caption: 'Patchwork fields' },
          { src: u(IMG.greenhouse, 1000), caption: 'Polyhouse rows' },
          { src: u(IMG.flatlay, 1000), caption: 'Morning harvest' },
          { src: u(IMG.farmSunset, 1000), caption: 'Golden hour' },
          { src: u(IMG.leaves, 1000), caption: 'New growth' },
          { src: u(IMG.greenField, 1000), caption: 'After the rain' },
          { src: u(IMG.market, 1000), caption: 'Village market' },
          { src: u(IMG.wheatSunset, 1000), caption: 'Ready for harvest' },
          { src: u(IMG.seedling, 1000), caption: 'Day 12' },
        ],
      },
      {
        id: 'testimonials', type: 'testimonials', enabled: true,
        eyebrow: 'Voices from the field',
        items: [
          { quote: 'In two seasons my soil came back to life. Yields are up 22% and I spend less on inputs than ever before.', name: 'Ramesh Patil', role: 'Grape farmer, Nashik', avatar: '' },
          { quote: 'The advisory on my phone tells me when to irrigate. We saved almost half our water this summer.', name: 'Lakshmi Devi', role: 'Paddy farmer, Thanjavur', avatar: '' },
          { quote: 'As a restaurant, traceability matters. With Bhoomi I know exactly which farm every tomato came from.', name: 'Arjun Mehta', role: 'Chef & founder, Ankur Kitchen', avatar: '' },
        ],
      },
      {
        id: 'journal', type: 'journal', enabled: true,
        eyebrow: 'Journal',
        title: 'Notes from the field.',
        posts: [
          { title: 'Why regenerative farming is the future of Indian agriculture', excerpt: 'Soil carbon, water tables and farmer incomes — the numbers behind the movement.', date: '2026-09-12', image: u(IMG.farmland, 1000), link: '#', tag: 'Insights' },
          { title: 'A monsoon diary: 90 days in a Kerala paddy', excerpt: 'Rain, resilience and the rhythm of transplanting season.', date: '2026-08-28', image: u(IMG.greenField, 1000), link: '#', tag: 'Stories' },
          { title: 'Drip vs. sprinkler: what our sensors learned', excerpt: 'Two years of moisture data across 600 plots, distilled.', date: '2026-07-19', image: u(IMG.greenhouse, 1000), link: '#', tag: 'Research' },
        ],
      },
      {
        id: 'faq', type: 'faq', enabled: true,
        eyebrow: 'FAQ',
        title: 'Questions? Answers.',
        items: [
          { q: 'Is all your produce certified organic?', a: 'Over 80% of our farms are NPOP / PGS-India certified. The rest are in conversion and grown under the same no-synthetic-pesticide protocol.' },
          { q: 'How can farmers join the Bhoomi network?', a: 'Fill the partner form below or visit any of our 40 village centres. Our agronomist will do a free soil test and walk you through the programme.' },
          { q: 'Where do you deliver?', a: 'We currently deliver to 28 cities across Maharashtra, Karnataka, Gujarat, Delhi NCR and Tamil Nadu.' },
          { q: 'Do you offer bulk supply for businesses?', a: 'Yes — restaurants, retailers and exporters can get contract-grown supply with fixed pricing. Reach out through the contact form.' },
        ],
      },
      {
        id: 'cta', type: 'cta', enabled: true,
        title: 'Let’s grow something *good* together.',
        text: 'Whether you farm one acre or a thousand, we would love to hear from you.',
        image: u(IMG.farmSunset, 2000),
        button: { label: 'Start a conversation', href: '#contact' },
      },
      {
        id: 'contact', type: 'contact', enabled: true,
        eyebrow: 'Contact',
        title: 'Say hello.',
        text: 'Questions about produce, partnerships or the farmer programme? Drop us a line — we reply within a day.',
        showNewsletter: true,
        newsletterTitle: 'Seasonal letters from the farm',
      },
    ],

    integrations: {
      googleAnalytics: { enabled: false, measurementId: '' },
      weather: { enabled: true, provider: 'open-meteo', apiKey: '', city: 'Nashik', lat: '19.9975', lon: '73.7898', units: 'metric' },
      unsplash: { enabled: false, accessKey: '' },
      whatsapp: { enabled: true, number: '919876543210', message: 'Namaste! I would like to know more about Bhoomi.' },
      webhook: { enabled: false, url: '', secret: '' },
      recaptcha: { enabled: false, siteKey: '', secretKey: '' },
      customScripts: { head: '', bodyEnd: '' },
      customApis: [],
    },

    messages: [],
    subscribers: [],
    media: [],
    users: [],
  };
}

const SECTION_LABELS = {
  hero: 'Hero', marquee: 'Marquee', about: 'About', stats: 'Stats', services: 'Services',
  process: 'Process (horizontal)', products: 'Products', live: 'Live data / APIs', gallery: 'Gallery',
  testimonials: 'Testimonials', journal: 'Journal / Blog', faq: 'FAQ', cta: 'Call to action', contact: 'Contact',
};

module.exports = { defaults, PRESETS, SECTION_LABELS };
