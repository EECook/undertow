require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
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
app.use(cookieParser());
app.use('/uploads', express.static(path.resolve(uploadDir)));
app.use(express.static(path.join(__dirname, '..', 'public')));

app.get('/api/health', (req, res) => res.json({ ok: true }));

app.get('/api', (req, res) => {
  res.json({
    name: 'The Undertow API',
    status: 'running',
    endpoints: [
      '/api/health',
      '/api/auth/discord/login',
      '/api/auth/me',
      '/api/auth/logout',
      '/api/profiles',
      '/api/characters',
      '/api/gallery',
      '/api/news',
      '/api/rules',
    ],
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

// Extra safety net: log and survive anything that still slips past
// asyncHandler (e.g. errors in code paths outside route handlers) instead
// of silently crashing the whole app.
process.on('unhandledRejection', (reason) => {
  console.error('[undertow] Unhandled promise rejection:', reason);
});
process.on('uncaughtException', (err) => {
  console.error('[undertow] Uncaught exception:', err);
});

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
