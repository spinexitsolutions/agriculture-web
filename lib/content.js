// Seed collections for a fresh install: catalogue, blog, pages, farmer tools.
// All of it is editable (and translatable) from /admin.
const u = (id, w = 1200) => `https://images.unsplash.com/${id}?auto=format&fit=crop&w=${w}&q=80`;

const IMG = {
  wheatSunset: 'photo-1500382017468-9049fed747ef', tractor: 'photo-1625246333195-78d9c38ad449', farmland: 'photo-1464226184884-fa280b87c399',
  wheat: 'photo-1574943320219-553eb213f72d', greenhouse: 'photo-1523348837708-15d4a09cfac2', seedling: 'photo-1530836369250-ef72a3f5cda8',
  farmSunset: 'photo-1500937386664-56d1dfef3854', veggies: 'photo-1592982537447-7440770cbfc9', farmerTablet: 'photo-1560493676-04071c5f467b',
  market: 'photo-1542838132-92c53300491e', basket: 'photo-1488459716781-31db52582fe9', flatlay: 'photo-1498837167922-ddd27525d352',
  greenField: 'photo-1444858291040-58f756a3bdd6', plants: 'photo-1416879595882-3373a0480b5b', leaves: 'photo-1501004318641-b39e6451bec6',
  strawberry: 'photo-1471193945509-9ad0617afabf',
};

const products = [
  { id: 'p1', slug: 'heirloom-vegetables-box', name: 'Heirloom Vegetables Box', category: 'Vegetables', price: 649, mrp: 749, unit: '5 kg', stock: 40, badge: 'Bestseller', featured: true, active: true,
    images: [u(IMG.veggies), u(IMG.basket)], summary: 'Seasonal mix of 8–10 heirloom vegetables, harvested the morning we ship.',
    description: 'A seasonal mix of **8–10 heirloom vegetables**, harvested the morning we ship.\n\n- Grown without synthetic pesticides\n- Packed in compostable crates\n- Contents change every week with the season\n\nStore leafy greens wrapped in a damp cloth in the fridge and use within 3 days.' },
  { id: 'p2', slug: 'stone-ground-wheat-atta', name: 'Stone-ground Wheat Atta', category: 'Grains', price: 420, mrp: 480, unit: '10 kg', stock: 120, badge: '', featured: true, active: true,
    images: [u(IMG.wheat), u(IMG.wheatSunset)], summary: 'Sharbati wheat from Madhya Pradesh, slow-ground on stone chakki.',
    description: 'Sharbati wheat from Sehore, Madhya Pradesh, **slow-ground on a stone chakki** to keep the bran and germ.\n\n- 100% whole wheat, no maida\n- Milled within 7 days of dispatch\n- Soft, sweet rotis' },
  { id: 'p3', slug: 'farm-fresh-strawberries', name: 'Farm Fresh Strawberries', category: 'Fruits', price: 299, mrp: 349, unit: '500 g', stock: 25, badge: 'Seasonal', featured: true, active: true,
    images: [u(IMG.strawberry)], summary: 'Mahabaleshwar strawberries, picked ripe and chilled within the hour.',
    description: 'Picked ripe in Mahabaleshwar and **chilled within the hour**. Available December to March.' },
  { id: 'p4', slug: 'rainbow-harvest-basket', name: 'Rainbow Harvest Basket', category: 'Vegetables', price: 899, mrp: 999, unit: '8 kg', stock: 30, badge: '', featured: true, active: true,
    images: [u(IMG.basket), u(IMG.flatlay)], summary: 'A family-size basket of vegetables, greens and fruit for the week.',
    description: 'Our family-size basket: vegetables, leafy greens and seasonal fruit for **a family of four for one week**.' },
  { id: 'p5', slug: 'market-greens-bundle', name: 'Market Greens Bundle', category: 'Greens', price: 249, mrp: 0, unit: '2 kg', stock: 60, badge: 'New', featured: true, active: true,
    images: [u(IMG.market)], summary: 'Palak, methi, coriander, mint and seasonal saag.',
    description: 'Palak, methi, coriander, mint and seasonal saag — **washed and bundled**.' },
  { id: 'p6', slug: 'kitchen-garden-starter-kit', name: 'Kitchen Garden Starter Kit', category: 'Seeds', price: 349, mrp: 399, unit: 'kit', stock: 80, badge: '', featured: true, active: true,
    images: [u(IMG.plants), u(IMG.seedling)], summary: '10 heirloom seed packets, cocopeat and a sowing guide in Hindi and English.',
    description: 'Everything to start a balcony garden:\n\n- 10 heirloom seed packets (tomato, chilli, brinjal, okra, coriander…)\n- 5 kg cocopeat block\n- Sowing calendar in **Hindi and English**' },
  { id: 'p7', slug: 'cold-pressed-groundnut-oil', name: 'Cold-pressed Groundnut Oil', category: 'Oils', price: 389, mrp: 450, unit: '1 L', stock: 70, badge: '', featured: false, active: true,
    images: [u(IMG.flatlay)], summary: 'Wood-pressed (kachi ghani) groundnut oil from Saurashtra.',
    description: 'Wood-pressed (**kachi ghani**) at low temperature to keep the natural aroma and nutrients.' },
  { id: 'p8', slug: 'organic-turmeric-powder', name: 'Organic Turmeric Powder', category: 'Spices', price: 180, mrp: 220, unit: '250 g', stock: 0, badge: '', featured: false, active: true,
    images: [u(IMG.leaves)], summary: 'Lakadong turmeric with 7%+ curcumin, sun-dried and stone-ground.',
    description: 'Lakadong turmeric from Meghalaya with **7%+ curcumin**, sun-dried and stone-ground.' },
];

const md = (...lines) => lines.join('\n');

const posts = [
  { id: 'b1', slug: 'why-regenerative-farming-is-the-future', title: 'Why regenerative farming is the future of Indian agriculture', category: 'Insights', tags: ['soil', 'regenerative'],
    excerpt: 'Soil carbon, water tables and farmer incomes — the numbers behind the movement.', cover: u(IMG.farmland, 1600), author: 'Dr. Meera Kulkarni', date: '2026-09-12', published: true,
    content: md('Over the last fifty years, Indian farms fed a growing nation — but at a cost to the soil. Organic carbon in many districts has fallen below **0.5%**, and groundwater tables keep dropping.',
      '', '## What regenerative means', '', 'Regenerative farming is a set of practices that **rebuild soil health** instead of depleting it:', '', '- Cover crops between seasons', '- Minimum or zero tillage', '- Composting and bio-inputs', '- Crop rotation and intercropping',
      '', '## What we have seen', '', 'Across 600 partner plots, farmers who followed the programme for two seasons saw input costs fall and yields stabilise.', '', '> Healthy soil is the cheapest fertiliser a farmer will ever buy.',
      '', 'If you farm and want to try it, [join the farmer programme](/farmers).') },
  { id: 'b2', slug: 'monsoon-diary-kerala-paddy', title: 'A monsoon diary: 90 days in a Kerala paddy', category: 'Stories', tags: ['paddy', 'monsoon'],
    excerpt: 'Rain, resilience and the rhythm of transplanting season.', cover: u(IMG.greenField, 1600), author: 'Arun Nair', date: '2026-08-28', published: true,
    content: md('The first rains arrive in early June. Within a week the fields of Kuttanad turn into mirrors.', '', '## Transplanting', '', 'Seedlings raised in nurseries are moved to the main field at 20–25 days. Spacing matters: we use 20 × 15 cm.', '', '## Water', '', 'Alternate wetting and drying saved our farmers close to **30% water** this season without hurting yields.') },
  { id: 'b3', slug: 'drip-vs-sprinkler-what-our-sensors-learned', title: 'Drip vs. sprinkler: what our sensors learned', category: 'Research', tags: ['irrigation', 'data'],
    excerpt: 'Two years of moisture data across 600 plots, distilled.', cover: u(IMG.greenhouse, 1600), author: 'Bhoomi Agronomy Team', date: '2026-07-19', published: true,
    content: md('We placed soil-moisture sensors in 600 plots across Maharashtra and Karnataka.', '', '## Key findings', '', '1. Drip used **35–45% less water** for vegetables.', '2. Sprinklers worked better for closely spaced crops like groundnut.', '3. Scheduling mattered more than the system itself.', '', 'Ask our agronomists which system suits your farm — [book a call-back](/farmers).') },
  { id: 'b4', slug: 'pm-kisan-what-farmers-should-know', title: 'Government schemes every farmer should check this season', category: 'Guides', tags: ['schemes'],
    excerpt: 'A plain-language summary of PM-KISAN, crop insurance, Soil Health Card and KCC.', cover: u(IMG.farmerTablet, 1600), author: 'Bhoomi Farmer Desk', date: '2026-06-30', published: true,
    content: md('Many farmers miss out on benefits simply because the paperwork feels confusing. Here is a short guide.', '', '## Before you apply', '', '- Keep your Aadhaar, bank passbook and land records ready', '- Make sure your bank account is linked to Aadhaar', '', 'See the full list on our [advisory page](/advisory). Always confirm current rules on the official portal.') },
];

const pages = [
  { id: 'pg-about', slug: 'about', title: 'About Bhoomi', subtitle: 'Healthy soil, fair prices, honest food.', cover: u(IMG.farmerTablet, 2000), showInFooter: false, seoDescription: 'The story, mission and team behind Bhoomi.',
    content: md('Bhoomi started in 2009 with twelve grape farmers in Nashik who were tired of rising input costs and falling soil health.', '', '## Our mission', '', 'To make regenerative farming **profitable** for every small farmer in India — and to bring that food, fully traceable, to families who care where it comes from.', '', '## How we work', '', '- **With farmers:** free soil tests, agronomy advice and guaranteed buy-back prices', '- **For customers:** produce harvested to order and delivered within 36 hours', '- **For the planet:** less water, fewer chemicals, more soil carbon') },
  { id: 'pg-farmers', slug: 'farmers', title: 'Farmer programme', subtitle: 'Free soil test. Expert advice. Guaranteed buy-back.', cover: u(IMG.wheatSunset, 2000), showInFooter: false, seoDescription: 'Join the Bhoomi farmer programme: free soil testing, advisory and guaranteed buy-back.',
    content: md('## What you get', '', '- **Free soil test** for your first plot', '- Weekly crop advice on WhatsApp in your language', '- Certified organic inputs at fair prices', '- **Guaranteed buy-back** at a price agreed before sowing', '- Payment within 48 hours of delivery', '', '## Who can join', '', 'Any farmer with at least half an acre who is willing to move away from synthetic pesticides over two seasons.') },
  { id: 'pg-careers', slug: 'careers', title: 'Careers', subtitle: 'Grow with us.', cover: u(IMG.greenhouse, 2000), showInFooter: false, seoDescription: 'Open roles at Bhoomi.',
    content: 'We are agronomists, engineers, field officers and food lovers. If you want your work to matter to farmers, we would love to hear from you.' },
  { id: 'pg-privacy', slug: 'privacy-policy', title: 'Privacy Policy', subtitle: '', cover: '', showInFooter: true, seoDescription: 'How Bhoomi collects and uses your data.',
    content: md('_Last updated: 1 October 2026. This is a template — have it reviewed by a lawyer before publishing._', '', '## What we collect', '', '- Contact details you share through our forms (name, phone, email, address)', '- Order and payment information (payments are processed by Razorpay; we never store card details)', '- Basic, anonymous usage analytics', '', '## How we use it', '', 'To deliver orders, reply to enquiries, run the farmer programme and improve our service. We do not sell your data.', '', '## Your rights', '', 'Email us to access, correct or delete your data.') },
  { id: 'pg-terms', slug: 'terms', title: 'Terms & Conditions', subtitle: '', cover: '', showInFooter: true, seoDescription: 'Terms of use for Bhoomi.',
    content: md('_Template — review with a lawyer before publishing._', '', '## Orders', '', 'Prices include GST unless stated. We may cancel an order if a product becomes unavailable; any payment will be refunded in full.', '', '## Product information', '', 'Fresh produce varies naturally in size, colour and weight. Weights are approximate within ±5%.') },
  { id: 'pg-refund', slug: 'refund-policy', title: 'Refund & Return Policy', subtitle: '', cover: '', showInFooter: true, seoDescription: 'Refunds and returns at Bhoomi.',
    content: md('_Template — adapt to your business._', '', '- Report damaged or spoiled produce **within 24 hours** of delivery with a photo.', '- We will replace the item or refund it to the original payment method within 5–7 working days.', '- Packaged goods can be returned unopened within 7 days.') },
  { id: 'pg-shipping', slug: 'shipping-policy', title: 'Shipping Policy', subtitle: '', cover: '', showInFooter: true, seoDescription: 'Delivery areas, timelines and charges.',
    content: md('_Template — adapt to your business._', '', '- Fresh produce ships in cold-chain vehicles to serviceable pincodes (check on any product page).', '- Typical delivery: **2–4 days**.', '- Delivery is free above the threshold shown at checkout.') },
];

const team = [
  { id: 't1', name: 'Ramesh Patil', role: 'Co-founder & Farmer', photo: '', bio: 'Third-generation grape farmer from Nashik.' },
  { id: 't2', name: 'Dr. Meera Kulkarni', role: 'Head of Agronomy', photo: '', bio: 'Soil scientist, 15 years with ICAR.' },
  { id: 't3', name: 'Arjun Mehta', role: 'Co-founder & CEO', photo: '', bio: 'Built supply chains for two food startups.' },
  { id: 't4', name: 'Lakshmi Devi', role: 'Farmer Network Lead', photo: '', bio: 'Leads a team of 40 field officers across 5 states.' },
];

const jobs = [
  { id: 'j1', title: 'Field Agronomist', location: 'Nashik, Maharashtra', type: 'Full-time', active: true, description: md('Visit partner farms, run soil tests and guide farmers through the season.', '', '**You have:** B.Sc./M.Sc. Agriculture, a two-wheeler licence, and you speak Marathi or Hindi.') },
  { id: 'j2', title: 'Supply Chain Coordinator', location: 'Pune, Maharashtra', type: 'Full-time', active: true, description: 'Plan daily pickups from farm clusters and coordinate cold-chain delivery to our hubs.' },
  { id: 'j3', title: 'Full-stack Developer', location: 'Remote (India)', type: 'Full-time', active: true, description: 'Build the tools our farmers and customers use every day — web, mobile and WhatsApp.' },
];

// months: 1 = January … 12 = December
const crops = [
  { id: 'c1', crop: 'Rice (Paddy)', season: 'Kharif', sow: [6, 7], harvest: [10, 11], notes: 'Transplant 20–25 day old seedlings.' },
  { id: 'c2', crop: 'Cotton', season: 'Kharif', sow: [5, 6], harvest: [10, 11, 12, 1], notes: 'Pick in 3–4 rounds.' },
  { id: 'c3', crop: 'Soybean', season: 'Kharif', sow: [6, 7], harvest: [9, 10], notes: 'Sow after 75–100 mm rain.' },
  { id: 'c4', crop: 'Maize', season: 'Kharif', sow: [6, 7], harvest: [9, 10], notes: '' },
  { id: 'c5', crop: 'Groundnut', season: 'Kharif', sow: [6, 7], harvest: [10, 11], notes: '' },
  { id: 'c6', crop: 'Wheat', season: 'Rabi', sow: [11, 12], harvest: [3, 4], notes: 'Timely sowing by mid-November gives best yields.' },
  { id: 'c7', crop: 'Gram (Chana)', season: 'Rabi', sow: [10, 11], harvest: [2, 3], notes: '' },
  { id: 'c8', crop: 'Mustard', season: 'Rabi', sow: [10, 11], harvest: [2, 3], notes: '' },
  { id: 'c9', crop: 'Onion (Rabi)', season: 'Rabi', sow: [11, 12], harvest: [4, 5], notes: 'Transplant 6–8 week old seedlings.' },
  { id: 'c10', crop: 'Watermelon', season: 'Zaid', sow: [2, 3], harvest: [4, 5, 6], notes: '' },
  { id: 'c11', crop: 'Moong (Green gram)', season: 'Zaid', sow: [3, 4], harvest: [5, 6], notes: 'Short 60–65 day crop.' },
];

const advisories = [
  { id: 'a1', title: 'Pink bollworm watch for cotton', crop: 'Cotton', region: 'Maharashtra, Gujarat', date: '2026-10-10', severity: 'High',
    content: 'Install pheromone traps (5 per acre). If you count 8 or more moths per trap for three nights, spray neem oil 1500 ppm and call our helpline.' },
  { id: 'a2', title: 'Ideal window for wheat sowing', crop: 'Wheat', region: 'North & Central India', date: '2026-10-08', severity: 'Info',
    content: 'Prepare fields now. Sow between 1 and 20 November for the best yields; treat seed with Trichoderma before sowing.' },
  { id: 'a3', title: 'Post-monsoon soil testing', crop: 'All crops', region: 'All regions', date: '2026-10-01', severity: 'Info',
    content: 'This is the best time to test soil before the Rabi season. Book a free soil test on the Farmer programme page.' },
];

const schemes = [
  { id: 's1', name: 'PM-KISAN', summary: 'Income support of ₹6,000 a year, paid in three instalments directly to eligible farmer families.', eligibility: 'Landholding farmer families (some exclusions apply).', link: 'https://pmkisan.gov.in' },
  { id: 's2', name: 'Pradhan Mantri Fasal Bima Yojana (PMFBY)', summary: 'Crop insurance against natural calamities, pests and diseases at a low farmer premium.', eligibility: 'All farmers growing notified crops in notified areas.', link: 'https://pmfby.gov.in' },
  { id: 's3', name: 'Soil Health Card', summary: 'Free soil testing with crop-wise nutrient recommendations.', eligibility: 'All farmers.', link: 'https://soilhealth.dac.gov.in' },
  { id: 's4', name: 'Kisan Credit Card (KCC)', summary: 'Short-term crop loans at concessional interest, with interest subvention for prompt repayment.', eligibility: 'Farmers, tenant farmers, SHGs and JLGs.', link: 'https://www.myscheme.gov.in' },
  { id: 's5', name: 'e-NAM', summary: 'Online national agriculture market to sell produce across mandis transparently.', eligibility: 'Farmers registered with a participating APMC.', link: 'https://enam.gov.in' },
];

module.exports = { products, posts, pages, team, jobs, crops, advisories, schemes };
