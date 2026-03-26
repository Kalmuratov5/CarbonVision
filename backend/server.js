import express from 'express';
import cors from 'cors';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = 5000;
const JWT_SECRET = 'carboncredit_uzbekistan_secret_2025';

app.use(cors({ origin: '*', credentials: true }));
app.use(express.json());

// ==================== IN-MEMORY DATABASE ====================
const db = {
  users: [],
  trees: [],
  credits: [],
  transactions: []
};

// ==================== TREE SPECIES DATA ====================
const treeSpecies = [
  { id: 'archa', name: 'Archa (Juniper)', nameLatin: 'Juniperus', co2PerYear: 22, icon: '🌲', category: 'conifer' },
  { id: 'terak', name: 'Terak (Poplar)', nameLatin: 'Populus', co2PerYear: 48, icon: '🌳', category: 'deciduous' },
  { id: 'tol', name: "To'l (Willow)", nameLatin: 'Salix', co2PerYear: 35, icon: '🌿', category: 'deciduous' },
  { id: 'chinor', name: 'Chinor (Plane Tree)', nameLatin: 'Platanus', co2PerYear: 56, icon: '🌳', category: 'deciduous' },
  { id: 'yongʼoq', name: "Yong'oq (Walnut)", nameLatin: 'Juglans regia', co2PerYear: 40, icon: '🌰', category: 'fruit' },
  { id: 'olma', name: 'Olma (Apple)', nameLatin: 'Malus domestica', co2PerYear: 20, icon: '🍎', category: 'fruit' },
  { id: 'shaftoli', name: 'Shaftoli (Peach)', nameLatin: 'Prunus persica', co2PerYear: 18, icon: '🍑', category: 'fruit' },
  { id: 'shumtol', name: "Shumto'l (Elm)", nameLatin: 'Ulmus', co2PerYear: 30, icon: '🌲', category: 'deciduous' },
  { id: 'qayin', name: 'Qayin (Birch)', nameLatin: 'Betula', co2PerYear: 25, icon: '🌿', category: 'deciduous' },
  { id: 'eman', name: 'Eman (Oak)', nameLatin: 'Quercus', co2PerYear: 48, icon: '🌳', category: 'deciduous' },
  { id: 'zarang', name: 'Zarang (Maple)', nameLatin: 'Acer', co2PerYear: 32, icon: '🍁', category: 'deciduous' },
  { id: 'pista', name: 'Pista (Pistachio)', nameLatin: 'Pistacia vera', co2PerYear: 15, icon: '🌿', category: 'fruit' },
];

// Credit price range (USD)
const CREDIT_PRICE_MIN = 40;
const CREDIT_PRICE_MAX = 80;
const CREDIT_PRICE_AVG = 60;

// ==================== HELPERS ====================
function calcCredits(species, count, ageYears = 1) {
  const sp = treeSpecies.find(s => s.id === species);
  if (!sp) return 0;
  const co2Total = sp.co2PerYear * count * ageYears; // kg
  return parseFloat((co2Total / 1000).toFixed(6)); // 1 credit = 1 tonne CO2
}

function calcEarnings(credits) {
  return {
    min: parseFloat((credits * CREDIT_PRICE_MIN).toFixed(4)),
    max: parseFloat((credits * CREDIT_PRICE_MAX).toFixed(4)),
    avg: parseFloat((credits * CREDIT_PRICE_AVG).toFixed(4)),
    minUzs: Math.round(credits * CREDIT_PRICE_MIN * 12700),
    maxUzs: Math.round(credits * CREDIT_PRICE_MAX * 12700),
  };
}

function generateCreditId() {
  return 'UZ-CC-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase();
}

function verifyToken(req, res, next) {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token yo\'q yoki noto\'g\'ri' });
  }
  try {
    const token = auth.split(' ')[1];
    req.user = jwt.verify(token, JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Token muddati o\'tgan yoki noto\'g\'ri' });
  }
}

// ==================== AUTH ROUTES ====================

// Register
app.post('/api/auth/register', async (req, res) => {
  const { name, email, password, phone, region } = req.body;
  if (!name || !email || !password) {
    return res.status(400).json({ error: 'Ism, email va parol kiritish shart' });
  }
  if (db.users.find(u => u.email === email)) {
    return res.status(409).json({ error: 'Bu email allaqachon ro\'yxatdan o\'tgan' });
  }
  const hashed = await bcrypt.hash(password, 10);
  const user = {
    id: uuidv4(),
    name,
    email,
    password: hashed,
    phone: phone || '',
    region: region || 'Toshkent',
    avatar: null,
    role: 'user',
    createdAt: new Date().toISOString(),
    totalTrees: 0,
    totalCredits: 0,
    totalEarningsUsd: 0,
  };
  db.users.push(user);
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  const { password: _, ...safeUser } = user;
  res.status(201).json({ token, user: safeUser });
});

// Login
app.post('/api/auth/login', async (req, res) => {
  const { email, password } = req.body;
  const user = db.users.find(u => u.email === email);
  if (!user) return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
  const match = await bcrypt.compare(password, user.password);
  if (!match) return res.status(401).json({ error: 'Parol noto\'g\'ri' });
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  const { password: _, ...safeUser } = user;
  res.json({ token, user: safeUser });
});

// Google Auth (mock - frontend sends Google user data)
app.post('/api/auth/google', async (req, res) => {
  const { googleId, name, email, avatar } = req.body;
  let user = db.users.find(u => u.email === email);
  if (!user) {
    user = {
      id: uuidv4(),
      name,
      email,
      password: null,
      googleId,
      avatar,
      phone: '',
      region: 'Toshkent',
      role: 'user',
      createdAt: new Date().toISOString(),
      totalTrees: 0,
      totalCredits: 0,
      totalEarningsUsd: 0,
    };
    db.users.push(user);
  } else {
    user.googleId = googleId;
    user.avatar = avatar;
  }
  const token = jwt.sign({ id: user.id, email: user.email }, JWT_SECRET, { expiresIn: '7d' });
  const { password: _, ...safeUser } = user;
  res.json({ token, user: safeUser });
});

// Get current user
app.get('/api/auth/me', verifyToken, (req, res) => {
  const user = db.users.find(u => u.id === req.user.id);
  if (!user) return res.status(404).json({ error: 'Foydalanuvchi topilmadi' });
  const { password: _, ...safeUser } = user;
  res.json(safeUser);
});

// ==================== TREE SPECIES ====================
app.get('/api/species', (req, res) => {
  res.json(treeSpecies);
});

// ==================== TREES ROUTES ====================

// Add tree
app.post('/api/trees', verifyToken, (req, res) => {
  const {
    species,
    count,
    ageYears,
    heightCm,
    diameterCm,
    locationName,
    latitude,
    longitude,
    description,
    photoUrl
  } = req.body;

  if (!species || !count || !latitude || !longitude) {
    return res.status(400).json({ error: 'Tur, soni va joylashuv kiritish shart' });
  }

  // Check for duplicate location (anti-fraud)
  const nearbyTree = db.trees.find(t => {
    if (t.userId !== req.user.id) return false;
    const dist = Math.sqrt(
      Math.pow((t.latitude - latitude) * 111000, 2) +
      Math.pow((t.longitude - longitude) * 111000, 2)
    );
    return dist < 10; // 10 metr ichida
  });

  if (nearbyTree) {
    return res.status(409).json({ 
      error: 'Bu joylashuvga yaqin (10m ichida) daraxt allaqachon ro\'yxatdan o\'tgan. Double-counting oldini olish tizimi ishlamoqda.' 
    });
  }

  const sp = treeSpecies.find(s => s.id === species);
  if (!sp) return res.status(400).json({ error: 'Noto\'g\'ri daraxt turi' });

  const credits = calcCredits(species, count, ageYears || 1);
  const earnings = calcEarnings(credits);
  const creditId = generateCreditId();

  const tree = {
    id: uuidv4(),
    userId: req.user.id,
    species,
    speciesName: sp.name,
    speciesIcon: sp.icon,
    count: parseInt(count),
    ageYears: parseFloat(ageYears) || 1,
    heightCm: parseFloat(heightCm) || null,
    diameterCm: parseFloat(diameterCm) || null,
    locationName: locationName || 'Noma\'lum joy',
    latitude: parseFloat(latitude),
    longitude: parseFloat(longitude),
    description: description || '',
    photoUrl: photoUrl || null,
    co2PerYear: sp.co2PerYear * count,
    credits,
    creditId,
    earnings,
    status: 'pending', // pending -> verified -> active
    verifiedAt: null,
    blockchainHash: 'UZ-BLOCK-' + uuidv4().replace(/-/g,'').toUpperCase(),
    createdAt: new Date().toISOString(),
  };

  db.trees.push(tree);

  // Update user stats
  const user = db.users.find(u => u.id === req.user.id);
  user.totalTrees += parseInt(count);
  user.totalCredits = parseFloat((user.totalCredits + credits).toFixed(6));
  user.totalEarningsUsd = parseFloat((user.totalEarningsUsd + earnings.avg).toFixed(4));

  // Auto-verify after 2 seconds (simulate satellite verification)
  setTimeout(() => {
    const t = db.trees.find(tr => tr.id === tree.id);
    if (t) {
      t.status = 'verified';
      t.verifiedAt = new Date().toISOString();
    }
  }, 2000);

  res.status(201).json(tree);
});

// Get user's trees
app.get('/api/trees', verifyToken, (req, res) => {
  const userTrees = db.trees.filter(t => t.userId === req.user.id);
  res.json(userTrees);
});

// Get all trees (map view)
app.get('/api/trees/all', verifyToken, (req, res) => {
  const allTrees = db.trees.map(t => ({
    id: t.id,
    species: t.species,
    speciesName: t.speciesName,
    speciesIcon: t.speciesIcon,
    count: t.count,
    latitude: t.latitude,
    longitude: t.longitude,
    locationName: t.locationName,
    credits: t.credits,
    status: t.status,
    createdAt: t.createdAt,
  }));
  res.json(allTrees);
});

// Get single tree
app.get('/api/trees/:id', verifyToken, (req, res) => {
  const tree = db.trees.find(t => t.id === req.params.id && t.userId === req.user.id);
  if (!tree) return res.status(404).json({ error: 'Daraxt topilmadi' });
  res.json(tree);
});

// Delete tree
app.delete('/api/trees/:id', verifyToken, (req, res) => {
  const idx = db.trees.findIndex(t => t.id === req.params.id && t.userId === req.user.id);
  if (idx === -1) return res.status(404).json({ error: 'Daraxt topilmadi' });
  const tree = db.trees[idx];
  
  // Update user stats
  const user = db.users.find(u => u.id === req.user.id);
  user.totalTrees -= tree.count;
  user.totalCredits = parseFloat((user.totalCredits - tree.credits).toFixed(6));
  user.totalEarningsUsd = parseFloat((user.totalEarningsUsd - tree.earnings.avg).toFixed(4));
  
  db.trees.splice(idx, 1);
  res.json({ success: true });
});

// ==================== DASHBOARD STATS ====================
app.get('/api/dashboard', verifyToken, (req, res) => {
  const user = db.users.find(u => u.id === req.user.id);
  const userTrees = db.trees.filter(t => t.userId === req.user.id);
  
  const totalCo2 = userTrees.reduce((sum, t) => sum + t.co2PerYear, 0);
  const verifiedTrees = userTrees.filter(t => t.status === 'verified');
  const pendingTrees = userTrees.filter(t => t.status === 'pending');
  
  // Species breakdown
  const speciesBreakdown = {};
  userTrees.forEach(t => {
    if (!speciesBreakdown[t.species]) {
      speciesBreakdown[t.species] = { name: t.speciesName, icon: t.speciesIcon, count: 0, credits: 0 };
    }
    speciesBreakdown[t.species].count += t.count;
    speciesBreakdown[t.species].credits += t.credits;
  });

  // Monthly data (last 6 months)
  const now = new Date();
  const monthlyData = [];
  for (let i = 5; i >= 0; i--) {
    const month = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const monthName = month.toLocaleDateString('uz-UZ', { month: 'short' });
    const monthTrees = userTrees.filter(t => {
      const d = new Date(t.createdAt);
      return d.getMonth() === month.getMonth() && d.getFullYear() === month.getFullYear();
    });
    monthlyData.push({
      month: monthName,
      trees: monthTrees.reduce((s, t) => s + t.count, 0),
      credits: parseFloat(monthTrees.reduce((s, t) => s + t.credits, 0).toFixed(4)),
    });
  }

  const earnings = calcEarnings(user.totalCredits);

  res.json({
    totalTrees: user.totalTrees,
    totalCredits: user.totalCredits,
    totalCo2Kg: totalCo2,
    totalCo2Tonnes: parseFloat((totalCo2 / 1000).toFixed(3)),
    verifiedCount: verifiedTrees.length,
    pendingCount: pendingTrees.length,
    earningsMin: earnings.min,
    earningsMax: earnings.max,
    earningsAvg: earnings.avg,
    earningsMinUzs: earnings.minUzs,
    earningsMaxUzs: earnings.maxUzs,
    speciesBreakdown: Object.values(speciesBreakdown),
    monthlyData,
    recentTrees: userTrees.slice(-5).reverse(),
  });
});

// ==================== GLOBAL STATS ====================
app.get('/api/stats/global', (req, res) => {
  const totalUsers = db.users.length;
  const totalTrees = db.trees.reduce((s, t) => s + t.count, 0);
  const totalCredits = parseFloat(db.trees.reduce((s, t) => s + t.credits, 0).toFixed(4));
  const totalCo2 = db.trees.reduce((s, t) => s + t.co2PerYear, 0);
  
  res.json({
    totalUsers,
    totalTrees,
    totalCredits,
    totalCo2Kg: totalCo2,
    totalCo2Tonnes: parseFloat((totalCo2 / 1000).toFixed(3)),
    totalValueUsd: parseFloat((totalCredits * CREDIT_PRICE_AVG).toFixed(2)),
  });
});

// ==================== CALCULATOR ====================
app.post('/api/calculate', (req, res) => {
  const { species, count, ageYears } = req.body;
  const sp = treeSpecies.find(s => s.id === species);
  if (!sp) return res.status(400).json({ error: 'Noto\'g\'ri tur' });
  
  const credits = calcCredits(species, count || 1, ageYears || 1);
  const earnings = calcEarnings(credits);
  
  res.json({
    species: sp,
    count: count || 1,
    ageYears: ageYears || 1,
    co2PerYear: sp.co2PerYear * (count || 1),
    co2Total: sp.co2PerYear * (count || 1) * (ageYears || 1),
    credits,
    earnings,
    creditId: generateCreditId(),
  });
});

// ==================== LEADERBOARD ====================
app.get('/api/leaderboard', (req, res) => {
  const leaders = db.users
    .map(u => ({ id: u.id, name: u.name, region: u.region, totalTrees: u.totalTrees, totalCredits: u.totalCredits }))
    .sort((a, b) => b.totalCredits - a.totalCredits)
    .slice(0, 10);
  res.json(leaders);
});

app.listen(PORT, () => {
  console.log(`🌿 CarbonCredit Backend running on http://localhost:${PORT}`);
});
