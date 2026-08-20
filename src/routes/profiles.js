const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { upload } = require('../middleware/upload');
const { requireAuth, requireRole } = require('../middleware/auth');
const { asyncHandler } = require('../utils/asyncHandler');

// List all resident profiles (public directory)
router.get('/', asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT id, discord_username, minecraft_username, display_name, bio, avatar_url, role, created_at
     FROM users ORDER BY created_at DESC`
  );
  res.json(rows);
}));

// Get a single profile, with their character sheets attached
router.get('/:id', asyncHandler(async (req, res) => {
  const [[user]] = await pool.query(`SELECT * FROM users WHERE id = ?`, [req.params.id]);
  if (!user) return res.status(404).json({ error: 'Resident not found' });

  const [characters] = await pool.query(
    `SELECT id, character_name, portrait_url, occupation, status FROM character_sheets
     WHERE user_id = ? AND is_public = TRUE`,
    [req.params.id]
  );
  res.json({ ...user, characters });
}));

// Accounts are normally created automatically on Discord login — this stays
// around for admins to hand-create an entry if ever needed.
router.post('/', requireRole('admin'), asyncHandler(async (req, res) => {
  const { discord_id, discord_username, minecraft_username, minecraft_uuid, display_name, bio } = req.body;
  const [result] = await pool.query(
    `INSERT INTO users (discord_id, discord_username, minecraft_username, minecraft_uuid, display_name, bio)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [discord_id, discord_username, minecraft_username, minecraft_uuid, display_name, bio]
  );
  res.status(201).json({ id: result.insertId });
}));

// Only you (or a moderator+) can edit your own profile.
function requireSelfOrModerator(req, res, next) {
  const targetId = Number(req.params.id);
  const isSelf = req.user.id === targetId;
  const isModPlus = ['moderator', 'admin'].includes(req.user.role);
  if (!isSelf && !isModPlus) return res.status(403).json({ error: 'Not your profile' });
  next();
}

router.patch('/:id', requireAuth, requireSelfOrModerator, asyncHandler(async (req, res) => {
  const { display_name, bio, minecraft_username } = req.body;
  await pool.query(
    `UPDATE users SET display_name = ?, bio = ?, minecraft_username = COALESCE(?, minecraft_username) WHERE id = ?`,
    [display_name, bio, minecraft_username, req.params.id]
  );
  res.json({ ok: true });
}));

router.post('/:id/avatar', requireAuth, requireSelfOrModerator, upload.single('avatar'), asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const avatarUrl = `/uploads/${req.file.filename}`;
  await pool.query(`UPDATE users SET avatar_url = ? WHERE id = ?`, [avatarUrl, req.params.id]);
  res.json({ avatar_url: avatarUrl });
}));

module.exports = router;
