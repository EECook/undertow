require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const { testConnection } = require('./db');
const { uploadDir } = require('./middleware/upload');

const profileRoutes = require('./routes/profiles');
const characterRoutes = require('./routes/characters');
const galleryRoutes = require('./routes/gallery');
const newsRoutes = require('./routes/news');
const rulesRoutes = require('./routes/rules');
const authRoutes = require('./routes/auth');

const app = express();

app.use(cors());
app.use(express.json());
app.use('/uploads', express.static(path.resolve(uploadDir)));

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.get('/', (req, res) => {
  res.json({
    name: 'The Undertow API',
    status: 'running',
    endpoints: ['/api/health', '/api/profiles', '/api/characters', '/api/gallery', '/api/news', '/api/rules', '/api/auth/admin-login'],
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/profiles', profileRoutes);
app.use('/api/characters', characterRoutes);
app.use('/api/gallery', galleryRoutes);
app.use('/api/news', newsRoutes);
app.use('/api/rules', rulesRoutes);

// Basic error handler (catches multer file-type/size errors, etc.)
app.use((err, req, res, next) => {
  console.error(err);
  res.status(err.status || 500).json({ error: err.message || 'Server error' });
});

const PORT = process.env.PORT || 3000;

testConnection()
  .then(() => {
    app.listen(PORT, () => console.log(`[undertow] API listening on port ${PORT}`));
  })
  .catch((err) => {
    console.error('[undertow] Failed to connect to database on boot.');
    console.error('[undertow]   code:', err.code);
    console.error('[undertow]   errno:', err.errno);
    console.error('[undertow]   message:', err.message || '(empty — see full error below)');
    console.error('[undertow]   full error object:', err);
    process.exit(1);
  });
