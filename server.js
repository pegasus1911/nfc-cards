const path = require('path');
const fs = require('fs');
const express = require('express');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// ---------- DATA & UPLOADS SETUP ----------
const DATA_DIR = path.join(__dirname, 'data');
const DATA_FILE = path.join(DATA_DIR, 'cards.json');
const UPLOAD_DIR = path.join(__dirname, 'public', 'uploads');

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR);
}
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const rawSlug = (req.body.slug || req.params.slug || 'card')
      .toString()
      .toLowerCase()
      .trim()
      .replace(/[^a-z0-9\-]+/g, '-')
      || 'card';
    const ext = path.extname(file.originalname) || '.jpg';
    cb(null, `${rawSlug}-${Date.now()}${ext}`);
  }
});

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    if (!file.mimetype.startsWith('image/')) {
      return cb(new Error('Only image files are allowed'));
    }
    cb(null, true);
  }
});

let cards = [];

// تحميل الكروت من الملف
function loadCards() {
  try {
    const raw = fs.readFileSync(DATA_FILE, 'utf8');
    cards = JSON.parse(raw);
    console.log(`Loaded ${cards.length} cards from file.`);
  } catch (err) {
    console.log('No cards file found, seeding default card...');
    cards = [
      {
        slug: 'ali',
        fullName: 'Ali Hasan',
        jobTitle: 'Software Engineer',
        company: 'My Company',
        phone: '+97330000000',
        whatsapp: '+97330000000',
        email: 'ali@example.com',
        website: 'https://example.com',
        linkedin: 'https://linkedin.com/in/ali',
        instagram: 'https://instagram.com/ali',
        avatarUrl: '',
        rtl: false
      }
    ];
    saveCards();
  }
}

// حفظ الكروت
function saveCards() {
  fs.writeFileSync(DATA_FILE, JSON.stringify(cards, null, 2), 'utf8');
  console.log(`Saved ${cards.length} cards to file.`);
}

loadCards();

// ---------- MIDDLEWARE ----------
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));

// ---------- API ROUTES ----------

// list all cards (admin)
app.get('/api/cards', (req, res) => {
  const list = cards.map(c => ({
    slug: c.slug,
    fullName: c.fullName,
    jobTitle: c.jobTitle,
    company: c.company
  }));
  res.json(list);
});

// get single card by slug (public/admin)
app.get('/api/cards/:slug', (req, res) => {
  const slug = (req.params.slug || '').toLowerCase();
  const card = cards.find(c => c.slug.toLowerCase() === slug);

  if (!card) {
    return res.status(404).json({ error: 'Card not found' });
  }

  res.json(card);
});

// create new card (with optional avatar file)
app.post('/api/cards', upload.single('avatarFile'), (req, res) => {
  const {
    slug,
    fullName,
    jobTitle,
    company,
    phone,
    whatsapp,
    email,
    website,
    linkedin,
    instagram,
    avatarUrl, // hidden field (optional)
    rtl
  } = req.body;

  if (!slug || !fullName) {
    return res.status(400).json({ error: 'slug and fullName are required' });
  }

  const normalizedSlug = slug.toLowerCase().trim();

  if (cards.some(c => c.slug.toLowerCase() === normalizedSlug)) {
    return res.status(409).json({ error: 'Slug already exists' });
  }

  let finalAvatarUrl = (avatarUrl || '').trim();
  if (req.file) {
    finalAvatarUrl = '/uploads/' + req.file.filename;
  }

  const newCard = {
    slug: normalizedSlug,
    fullName: fullName.trim(),
    jobTitle: (jobTitle || '').trim(),
    company: (company || '').trim(),
    phone: (phone || '').trim(),
    whatsapp: (whatsapp || '').trim(),
    email: (email || '').trim(),
    website: (website || '').trim(),
    linkedin: (linkedin || '').trim(),
    instagram: (instagram || '').trim(),
    avatarUrl: finalAvatarUrl,
    rtl: rtl === 'on' || rtl === 'true' || rtl === '1'
  };

  cards.push(newCard);
  saveCards();

  return res.json({
    success: true,
    slug: newCard.slug
  });
});

// update existing card (optional new avatar file)
app.put('/api/cards/:slug', upload.single('avatarFile'), (req, res) => {
  const paramSlug = (req.params.slug || '').toLowerCase().trim();
  const index = cards.findIndex(c => c.slug.toLowerCase() === paramSlug);

  if (index === -1) {
    return res.status(404).json({ error: 'Card not found' });
  }

  const {
    fullName,
    jobTitle,
    company,
    phone,
    whatsapp,
    email,
    website,
    linkedin,
    instagram,
    avatarUrl,
    rtl
  } = req.body;

  const card = cards[index];

  if (fullName !== undefined) card.fullName = fullName.trim();
  if (jobTitle !== undefined) card.jobTitle = (jobTitle || '').trim();
  if (company !== undefined) card.company = (company || '').trim();
  if (phone !== undefined) card.phone = (phone || '').trim();
  if (whatsapp !== undefined) card.whatsapp = (whatsapp || '').trim();
  if (email !== undefined) card.email = (email || '').trim();
  if (website !== undefined) card.website = (website || '').trim();
  if (linkedin !== undefined) card.linkedin = (linkedin || '').trim();
  if (instagram !== undefined) card.instagram = (instagram || '').trim();

  if (req.file) {
    card.avatarUrl = '/uploads/' + req.file.filename;
  } else if (avatarUrl !== undefined && avatarUrl !== '') {
    card.avatarUrl = avatarUrl.trim();
  }

  if (rtl !== undefined) {
    card.rtl = rtl === 'on' || rtl === 'true' || rtl === '1';
  }

  saveCards();

  return res.json({
    success: true,
    slug: card.slug
  });
});

// ---------- PAGES ----------

// public card page
app.get('/u/:slug', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'card.html'));
});

// admin page
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// ---------- START SERVER ----------
app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
