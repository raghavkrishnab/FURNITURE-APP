import express from 'express';
import cors from 'cors';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const app = express();
const port = process.env.PORT || 4000;
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataPath = path.join(__dirname, 'data.json');

app.use(cors());
app.use(express.json());

const escapeXml = (value) => String(value)
  .replace(/&/g, '&amp;')
  .replace(/</g, '&lt;')
  .replace(/>/g, '&gt;')
  .replace(/"/g, '&quot;')
  .replace(/'/g, '&apos;');

const makeImage = (title, category, seed = 0) => {
  const hue = (seed * 37) % 360;
  const accentHue = (hue + 34) % 360;
  const bg = `hsl(${hue} 36% 13%)`;
  const panel = `hsl(${accentHue} 42% 24%)`;
  const accent = `hsl(${(accentHue + 24) % 360} 58% 62%)`;
  const stone = `hsl(${(hue + 180) % 360} 18% 72%)`;
  const label = escapeXml(title);
  const section = escapeXml(category);

  let furnitureMarkup = '';
  switch (category) {
    case 'Dining Table':
      furnitureMarkup = `<rect x="140" y="228" width="520" height="115" rx="26" fill="${accent}" fill-opacity="0.95"/><rect x="175" y="170" width="450" height="72" rx="20" fill="white" fill-opacity="0.22"/><rect x="182" y="332" width="86" height="118" rx="18" fill="#111" fill-opacity="0.6"/><rect x="528" y="332" width="86" height="118" rx="18" fill="#111" fill-opacity="0.6"/><rect x="310" y="170" width="180" height="56" rx="18" fill="${stone}" fill-opacity="0.45"/>`;
      break;
    case 'Chair':
      furnitureMarkup = `<rect x="220" y="260" width="180" height="170" rx="24" fill="${accent}" fill-opacity="0.96"/><rect x="208" y="210" width="90" height="120" rx="20" fill="${panel}"/><rect x="300" y="230" width="96" height="92" rx="20" fill="${stone}" fill-opacity="0.78"/><rect x="250" y="430" width="120" height="80" rx="24" fill="#111" fill-opacity="0.58"/>`;
      break;
    case 'Bed':
      furnitureMarkup = `<rect x="160" y="250" width="480" height="180" rx="30" fill="${accent}" fill-opacity="0.95"/><rect x="185" y="214" width="430" height="78" rx="24" fill="white" fill-opacity="0.2"/><rect x="200" y="290" width="160" height="88" rx="20" fill="white" fill-opacity="0.8"/><rect x="440" y="290" width="160" height="88" rx="20" fill="white" fill-opacity="0.8"/><rect x="150" y="430" width="500" height="32" rx="16" fill="#111" fill-opacity="0.45"/>`;
      break;
    case 'Dressing Table':
      furnitureMarkup = `<rect x="200" y="235" width="400" height="130" rx="24" fill="${accent}" fill-opacity="0.96"/><rect x="232" y="180" width="336" height="82" rx="22" fill="white" fill-opacity="0.24"/><rect x="265" y="192" width="270" height="54" rx="16" fill="${stone}" fill-opacity="0.82"/><rect x="242" y="360" width="116" height="90" rx="18" fill="#111" fill-opacity="0.55"/><rect x="442" y="360" width="116" height="90" rx="18" fill="#111" fill-opacity="0.55"/>`;
      break;
    case 'Coffee Table':
      furnitureMarkup = `<rect x="210" y="275" width="380" height="115" rx="26" fill="${accent}" fill-opacity="0.92"/><rect x="240" y="250" width="320" height="44" rx="16" fill="white" fill-opacity="0.22"/><rect x="270" y="320" width="80" height="80" rx="18" fill="${stone}" fill-opacity="0.7"/><rect x="450" y="320" width="80" height="80" rx="18" fill="${stone}" fill-opacity="0.7"/>`;
      break;
    case 'PC Table':
      furnitureMarkup = `<rect x="165" y="220" width="470" height="120" rx="24" fill="${accent}" fill-opacity="0.95"/><rect x="205" y="180" width="390" height="70" rx="16" fill="${panel}"/><rect x="248" y="192" width="300" height="46" rx="12" fill="white" fill-opacity="0.25"/><rect x="248" y="345" width="120" height="84" rx="18" fill="#111" fill-opacity="0.55"/><rect x="430" y="345" width="118" height="84" rx="18" fill="#111" fill-opacity="0.55"/>`;
      break;
    case 'Sofa':
      furnitureMarkup = `<rect x="155" y="250" width="490" height="150" rx="32" fill="${accent}" fill-opacity="0.96"/><rect x="185" y="220" width="430" height="86" rx="24" fill="white" fill-opacity="0.2"/><rect x="220" y="285" width="160" height="74" rx="22" fill="white" fill-opacity="0.76"/><rect x="420" y="285" width="160" height="74" rx="22" fill="white" fill-opacity="0.76"/><rect x="258" y="360" width="280" height="36" rx="18" fill="#111" fill-opacity="0.44"/>`;
      break;
    default:
      furnitureMarkup = `<rect x="190" y="200" width="420" height="220" rx="32" fill="${accent}" fill-opacity="0.9"/><rect x="240" y="168" width="320" height="78" rx="24" fill="white" fill-opacity="0.2"/><rect x="260" y="290" width="280" height="78" rx="22" fill="white" fill-opacity="0.7"/>`;
  }

  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 800 600"><rect width="800" height="600" fill="${bg}"/><rect x="58" y="58" width="684" height="484" rx="34" fill="${panel}" fill-opacity="0.95"/><circle cx="660" cy="170" r="112" fill="${accent}" fill-opacity="0.24"/><circle cx="170" cy="470" r="132" fill="${stone}" fill-opacity="0.2"/>${furnitureMarkup}<text x="400" y="510" text-anchor="middle" font-size="34" font-family="Segoe UI, sans-serif" fill="white">${label}</text><text x="400" y="548" text-anchor="middle" font-size="20" font-family="Segoe UI, sans-serif" fill="#f6e8d7">${section} • Furnish Hub</text></svg>`;
  return `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
};

const catalogBlueprints = [
  {
    key: 'dining-table',
    category: 'Dining Table',
    colorA: '#1f2b2b',
    colorB: '#6f8b7a',
    basePrice: 32990,
    styleNames: ['Luna', 'Aurelia', 'Sora', 'Crest', 'Harbor', 'Mira', 'Noble', 'Orion', 'Valen', 'Rivet', 'Atlas', 'Tide', 'Eira', 'Cedar', 'Nova', 'Solace', 'Basil', 'Rook', 'Monarch', 'Atelier'],
    badges: ['New arrival', 'Bestseller', 'Designer pick', 'Limited edition', 'Signature'],
    materials: ['Travertine marble', 'Solid oak', 'Ash veneer', 'Quartz stone', 'Walnut grain'],
    descriptions: ['Sculpted silhouette with premium finish.', 'Engineered for family dinners and hosting.', 'A polished centerpiece for open-plan homes.', 'Crafted with durable joinery and timeless styling.', 'Elegant proportions with a warm artisan finish.'],
    deliveryWindows: ['5-7 days', '7-10 days', '4-6 days', '8-12 days', '6-8 days']
  },
  {
    key: 'chair',
    category: 'Chair',
    colorA: '#2b221d',
    colorB: '#7a4d2d',
    basePrice: 12990,
    styleNames: ['Contour', 'Velora', 'Piper', 'Sculpt', 'Dune', 'Halo', 'Marlow', 'Cove', 'Astra', 'Fable', 'North', 'Lumen', 'Vanta', 'Sienna', 'Briar', 'Sage', 'Echo', 'Etta', 'Pace', 'Oriel'],
    badges: ['New arrival', 'Best seller', 'Limited edition', 'Studio edit', 'Made for comfort'],
    materials: ['Velvet upholstery', 'Ash wood', 'Leatherette', 'Brushed metal', 'Textile weave'],
    descriptions: ['Comfort-led form with sculpted detailing.', 'A graceful accent for lounge corners and reading nooks.', 'Soft cushioning and refined support for everyday use.', 'Built to blend seamlessly into modern interiors.', 'An elevated seat with premium finish and posture support.'],
    deliveryWindows: ['3-5 days', '4-6 days', '2-4 days', '5-7 days', '6-8 days']
  },
  {
    key: 'bed',
    category: 'Bed',
    colorA: '#23262b',
    colorB: '#8b6f57',
    basePrice: 44990,
    styleNames: ['Cloud', 'Aurora', 'Northstar', 'Vesper', 'Marlow', 'Aurex', 'Solis', 'Linen', 'Cinder', 'Sorrento', 'Noir', 'Dover', 'Bramble', 'Ridge', 'Cielo', 'Tess', 'Alder', 'Luma', 'Weston', 'Arden'],
    badges: ['New arrival', 'Premium', 'Signature', 'Limited edition', 'Bestseller'],
    materials: ['Linen upholstery', 'Solid teak', 'Oak veneer', 'Bouclé fabric', 'Matte lacquer'],
    descriptions: ['A calm, plush centerpiece for restful interiors.', 'A refined frame with architectural headboard styling.', 'Crafted for comfort, presence, and lasting durability.', 'Soft lines and luxe finishes for a spa-like bedroom.', 'An understated bed with premium craftsmanship.'],
    deliveryWindows: ['6-9 days', '8-12 days', '5-7 days', '7-10 days', '9-12 days']
  },
  {
    key: 'dressing-table',
    category: 'Dressing Table',
    colorA: '#2d241b',
    colorB: '#9d7a4e',
    basePrice: 28990,
    styleNames: ['Mira', 'Aster', 'Celeste', 'Veda', 'Rosie', 'Belle', 'Nova', 'Opal', 'Dahlia', 'Elm', 'Liora', 'Isla', 'Etta', 'Cleo', 'Tara', 'Fleur', 'Satin', 'Rhea', 'Enna', 'Luxe'],
    badges: ['Studio edit', 'New launch', 'Luxury pick', 'Designer favorite', 'Made to order'],
    materials: ['Walnut veneer', 'White marble', 'Solid ash', 'Mirror finish', 'Oak trim'],
    descriptions: ['A graceful vanity for everyday rituals and display.', 'Soft storage and elegant framing in one piece.', 'Built with premium mirrors and concealed drawers.', 'A sculpted makeup station with practical storage.', 'Turkish-inspired detailing with a modern silhouette.'],
    deliveryWindows: ['4-6 days', '5-7 days', '6-8 days', '7-9 days', '8-10 days']
  },
  {
    key: 'coffee-table',
    category: 'Coffee Table',
    colorA: '#2f2a24',
    colorB: '#8c6f4c',
    basePrice: 18990,
    styleNames: ['Crest', 'Aria', 'Bento', 'Ply', 'Nori', 'Coda', 'Tango', 'Cove', 'Ridge', 'Mica', 'Woven', 'Orbit', 'Sora', 'Drift', 'Haven', 'Kova', 'Luma', 'Tonic', 'Memento', 'Fjord'],
    badges: ['New arrival', 'Low profile', 'Bestseller', 'Designer pick', 'Signature'],
    materials: ['Travertine top', 'Oak slab', 'Brushed brass', 'Stone veneer', 'Walnut base'],
    descriptions: ['Low, sculptural lines for modern living rooms.', 'A tactile centerpiece designed for conversation and comfort.', 'Refined grain and finish for elevated everyday living.', 'A compact table made for display and hosting.', 'Crafted to anchor lounges with graceful balance.'],
    deliveryWindows: ['3-5 days', '4-6 days', '5-7 days', '6-8 days', '7-9 days']
  },
  {
    key: 'pc-table',
    category: 'PC Table',
    colorA: '#1d2428',
    colorB: '#5f7282',
    basePrice: 15990,
    styleNames: ['Nimbus', 'Pixel', 'Atlas', 'Terra', 'Orbit', 'Kestrel', 'Bento', 'Pixel', 'Motive', 'Vertex', 'Kite', 'Ridge', 'Craft', 'Milo', 'Clarity', 'Onyx', 'Duo', 'Tact', 'Arc', 'Frame'],
    badges: ['Work ready', 'New launch', 'Compact', 'Smart storage', 'Premium'],
    materials: ['Powder-coated steel', 'MDF core', 'Oak finish', 'Laminate top', 'Brushed aluminium'],
    descriptions: ['A streamlined workspace with cable-friendly detailing.', 'Built to keep screen setups tidy and visually calm.', 'A compact desk solution for homes and studios.', 'Form follows function with durable premium surfaces.', 'Ideal for focused work with hidden storage and clean lines.'],
    deliveryWindows: ['4-6 days', '5-7 days', '3-5 days', '6-8 days', '7-9 days']
  },
  {
    key: 'sofa',
    category: 'Sofa',
    colorA: '#2f2a24',
    colorB: '#6b5a46',
    basePrice: 59990,
    styleNames: ['Velora', 'Avenue', 'Arielle', 'Crestline', 'Tilda', 'Lounge', 'Atoll', 'Mira', 'Kairo', 'Soleil', 'Noble', 'Draper', 'Finesse', 'Aster', 'Harlow', 'Rivet', 'Sage', 'Sculpt', 'Coda', 'Romy'],
    badges: ['New arrival', 'Bestseller', 'Luxury comfort', 'Limited edition', 'Signature'],
    materials: ['Bouclé fabric', 'Italian leather', 'Performance velvet', 'Textured weave', 'Wool blend'],
    descriptions: ['Plush comfort with sculpted arms and premium upholstery.', 'A statement piece for modern living spaces.', 'Designed for lounging, hosting, and long evenings.', 'Tailored profile with durable cushioning and rich texture.', 'A polished and inviting sofa with architectural presence.'],
    deliveryWindows: ['7-10 days', '8-12 days', '6-8 days', '9-12 days', '10-14 days']
  }
];

const generatedProducts = catalogBlueprints.flatMap(({ key, category, colorA, colorB, basePrice, styleNames, badges, materials, descriptions, deliveryWindows }) => 
  styleNames.map((styleName, index) => ({
    id: `${key}-${index + 1}`,
    name: `${styleName} ${category}`,
    category,
    badge: badges[index % badges.length],
    description: descriptions[index % descriptions.length],
    material: materials[index % materials.length],
    deliveryWindow: deliveryWindows[index % deliveryWindows.length],
    price: basePrice + index * 3200 + (index % 3) * 1800,
    stock: 2 + (index % 6),
    image: makeImage(`${styleName} ${category}`, category, index + 1)
  }))
);

const readData = () => {
  if (!fs.existsSync(dataPath)) {
    return { orders: [], users: [], sessions: [] };
  }

  try {
    const parsed = JSON.parse(fs.readFileSync(dataPath, 'utf8'));
    return {
      orders: Array.isArray(parsed?.orders) ? parsed.orders : [],
      users: Array.isArray(parsed?.users) ? parsed.users : [],
      sessions: Array.isArray(parsed?.sessions) ? parsed.sessions : [],
      products: Array.isArray(parsed?.products) ? parsed.products : []
    };
  } catch (error) {
    return { orders: [], users: [], sessions: [], products: [] };
  }
};

const writeData = (data) => {
  fs.writeFileSync(dataPath, JSON.stringify(data, null, 2));
};

let { orders, users, sessions, products: persistedProducts } = readData();
let products = Array.isArray(persistedProducts) && persistedProducts.length === generatedProducts.length
  ? persistedProducts
  : generatedProducts;

const persist = () => {
  writeData({ orders, users, sessions, products });
};

if (!Array.isArray(persistedProducts) || persistedProducts.length !== generatedProducts.length) {
  persist();
}

const getSafeUser = (user) => ({ id: user.id, name: user.name, role: user.role, email: user.email });

const createSession = (user) => {
  const token = crypto.randomUUID();
  const entry = { token, user: getSafeUser(user), createdAt: new Date().toISOString() };
  sessions = [entry, ...sessions.filter((session) => session.user.id !== user.id)];
  persist();
  return token;
};

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization?.split(' ');
  if (authHeader?.[0] !== 'Bearer' || !authHeader[1]) {
    return res.status(401).json({ error: 'Authentication required' });
  }

  const session = sessions.find((entry) => entry.token === authHeader[1]);
  if (!session) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }

  req.user = session.user;
  next();
};

const authorize = (...roles) => (req, res, next) => {
  if (!req.user || !roles.includes(req.user.role)) {
    return res.status(403).json({ error: 'Access denied' });
  }
  next();
};

if (!users.length) {
  users = [
    { id: 'cust-1', name: 'Aarav Singh', role: 'customer', email: 'customer@furnishhub.com', password: 'customer123' },
    { id: 'adm-1', name: 'Nisha Rao', role: 'admin', email: 'admin@furnishhub.com', password: 'admin123' },
    { id: 'del-1', name: 'Dev Patel', role: 'delivery', email: 'delivery@furnishhub.com', password: 'delivery123' },
    { id: 'ins-1', name: 'Mira Shah', role: 'installation', email: 'install@furnishhub.com', password: 'install123' }
  ];
  persist();
}

if (!orders.length) {
  orders = [
    {
      id: 'ord-demo-1',
      customerName: 'Aarav Singh',
      customerEmail: 'customer@furnishhub.com',
      phone: '9876543210',
      address: '18, Sukhdev Vihar, New Delhi',
      deliveryNotes: 'Ring the bell twice.',
      items: [{ id: 'p1', name: 'Sculpted Lounge Chair', quantity: 1, price: 1290 }],
      total: 1789,
      status: 'Dispatched',
      deliveryStatus: 'Out for Delivery',
      installationStatus: 'Pending',
      refundRequested: false,
      trackingNumber: 'TRK-1284',
      createdAt: new Date().toISOString()
    },
    {
      id: 'ord-demo-2',
      customerName: 'Meera Iyer',
      customerEmail: 'customer@furnishhub.com',
      phone: '9123456780',
      address: '7, Park Street, Mumbai',
      deliveryNotes: 'Install in the living room.',
      items: [{ id: 'p2', name: 'Marble Dining Table', quantity: 1, price: 2890 }],
      total: 3389,
      status: 'Installation Scheduled',
      deliveryStatus: 'Delivered',
      installationStatus: 'Scheduled',
      refundRequested: false,
      trackingNumber: 'TRK-2819',
      createdAt: new Date().toISOString()
    }
  ];
  persist();
}

app.get('/api/products', (req, res) => res.json(products));

app.post('/api/auth', (req, res) => {
  const { email, password } = req.body;
  const user = users.find((entry) => entry.email === email && entry.password === password);
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const token = createSession(user);
  res.json({ user: getSafeUser(user), token });
});

app.get('/api/auth/me', authenticate, (req, res) => {
  res.json({ user: req.user });
});

app.post('/api/auth/register', (req, res) => {
  const { name, email, password } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Please complete the registration form.' });
  }
  const existing = users.find((entry) => entry.email === email);
  if (existing) {
    return res.status(409).json({ error: 'An account already exists for this email.' });
  }

  const newUser = { id: `usr-${Date.now()}`, name, role: 'customer', email, password };
  users.unshift(newUser);
  persist();
  const token = createSession(newUser);
  res.json({ user: getSafeUser(newUser), token });
});

app.post('/api/orders', authenticate, authorize('customer'), (req, res) => {
  const order = {
    id: `ord-${Date.now()}`,
    ...req.body,
    createdAt: new Date().toISOString()
  };
  orders.unshift(order);
  persist();
  res.json(order);
});

app.get('/api/orders', authenticate, (req, res) => {
  let visibleOrders = orders;
  if (req.user.role === 'customer') {
    visibleOrders = orders.filter((order) => order.customerEmail === req.user.email);
  } else if (req.user.role === 'delivery') {
    visibleOrders = orders.filter((order) => order.deliveryStatus !== 'Delivered' && order.status !== 'Completed');
  } else if (req.user.role === 'installation') {
    visibleOrders = orders.filter((order) => order.installationStatus !== 'Completed' && order.status !== 'Completed');
  }
  res.json(visibleOrders);
});

app.patch('/api/orders/:id', authenticate, (req, res) => {
  const order = orders.find((entry) => entry.id === req.params.id);
  if (!order) return res.status(404).json({ error: 'Order not found' });

  if (req.user.role === 'customer') {
    if (order.customerEmail !== req.user.email) {
      return res.status(403).json({ error: 'You can only update your own orders.' });
    }

    const updates = {};
    if ('refundRequested' in req.body) {
      updates.refundRequested = Boolean(req.body.refundRequested);
      if (updates.refundRequested) {
        updates.status = 'Refund Requested';
      }
    }
    if ('installationStatus' in req.body) {
      updates.installationStatus = String(req.body.installationStatus);
      if (updates.installationStatus === 'Scheduled') {
        updates.status = 'Installation Scheduled';
      }
      if (updates.installationStatus === 'Completed') {
        updates.status = 'Completed';
      }
    }

    Object.assign(order, updates);
  } else {
    Object.assign(order, req.body);
  }

  persist();
  res.json(order);
});

app.use('/api', (req, res) => {
  res.status(404).json({ error: 'API endpoint not found' });
});

app.use(express.static(path.join(__dirname, '..', 'dist')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'dist', 'index.html'));
});

app.use((err, req, res, next) => {
  console.error(err);
  if (req.path.startsWith('/api')) {
    return res.status(500).json({ error: 'Internal server error' });
  }
  next(err);
});

app.listen(port, () => {
  console.log(`Furnish Hub server running on http://localhost:${port}`);
});
