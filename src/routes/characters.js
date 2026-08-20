const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { upload } = require('../middleware/upload');
const { requireAuth, requireRole } = require('../middleware/auth');
const { asyncHandler } = require('../utils/asyncHandler');

async function getSheetOwner(id) {
  const [[row]] = await pool.query(`SELECT user_id FROM character_sheets WHERE id = ?`, [id]);
  return row ? row.user_id : null;
}

// Only the sheet's owner, or a moderator+, may modify/delete it.
function requireOwnerOrModerator() {
  return [
    requireAuth,
    asyncHandler(async (req, res, next) => {
      const ownerId = await getSheetOwner(req.params.id);
      if (ownerId === null) return res.status(404).json({ error: 'Character sheet not found' });
      const isOwner = ownerId === req.user.id;
      const isModPlus = ['moderator', 'admin'].includes(req.user.role);
      if (!isOwner && !isModPlus) return res.status(403).json({ error: 'Not your character sheet' });
      next();
    }),
  ];
}

// List public character sheets (for a browsable "residents of the town" page)
router.get('/', asyncHandler(async (req, res) => {
  const [rows] = await pool.query(
    `SELECT cs.*, u.display_name AS player_name
     FROM character_sheets cs JOIN users u ON u.id = cs.user_id
     WHERE cs.is_public = TRUE ORDER BY cs.created_at DESC`
  );
  res.json(rows);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const [[sheet]] = await pool.query(`SELECT * FROM character_sheets WHERE id = ?`, [req.params.id]);
  if (!sheet) return res.status(404).json({ error: 'Character sheet not found' });
  res.json(sheet);
}));

// Creates a sheet owned by whoever is logged in — user_id comes from the
// session now, never from the request body, so nobody can create a sheet
// under someone else's name.
router.post('/', requireAuth, asyncHandler(async (req, res) => {
  const { character_name, occupation, backstory, traits, is_public } = req.body;
  const [result] = await pool.query(
    `INSERT INTO character_sheets (user_id, character_name, occupation, backstory, traits, is_public)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [req.user.id, character_name, occupation, backstory, traits, is_public ?? true]
  );
  res.status(201).json({ id: result.insertId });
}));

router.patch('/:id', requireOwnerOrModerator(), asyncHandler(async (req, res) => {
  const { character_name, occupation, backstory, traits, status, is_public } = req.body;
  await pool.query(
    `UPDATE character_sheets SET character_name = ?, occupation = ?, backstory = ?, traits = ?, status = ?, is_public = ?
     WHERE id = ?`,
    [character_name, occupation, backstory, traits, status, is_public, req.params.id]
  );
  res.json({ ok: true });
}));

router.delete('/:id', requireOwnerOrModerator(), asyncHandler(async (req, res) => {
  await pool.query(`DELETE FROM character_sheets WHERE id = ?`, [req.params.id]);
  res.json({ ok: true });
}));

router.post('/:id/portrait', requireOwnerOrModerator(), upload.single('portrait'), asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const portraitUrl = `/uploads/${req.file.filename}`;
  await pool.query(`UPDATE character_sheets SET portrait_url = ? WHERE id = ?`, [
    portraitUrl,
    req.params.id,
  ]);
  res.json({ portrait_url: portraitUrl });
}));

module.exports = router;
