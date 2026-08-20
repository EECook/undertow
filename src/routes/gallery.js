const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { upload } = require('../middleware/upload');
const { requireAdmin } = require('../middleware/auth');
const { asyncHandler } = require('../utils/asyncHandler');

router.get('/', asyncHandler(async (req, res) => {
  const { category } = req.query;
  const [rows] = category
    ? await pool.query(`SELECT * FROM gallery_images WHERE category = ? ORDER BY uploaded_at DESC`, [category])
    : await pool.query(`SELECT * FROM gallery_images ORDER BY uploaded_at DESC`);
  res.json(rows);
}));

// Any logged-in resident can upload to the gallery — swap requireAdmin for
// a requireUser check once real per-resident sessions exist.
router.post('/', upload.single('image'), asyncHandler(async (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No file uploaded' });
  const { user_id, caption, category } = req.body;
  const imageUrl = `/uploads/${req.file.filename}`;
  const [result] = await pool.query(
    `INSERT INTO gallery_images (user_id, image_url, caption, category) VALUES (?, ?, ?, ?)`,
    [user_id || null, imageUrl, caption || null, category || 'other']
  );
  res.status(201).json({ id: result.insertId, image_url: imageUrl });
}));

router.delete('/:id', requireAdmin, asyncHandler(async (req, res) => {
  await pool.query(`DELETE FROM gallery_images WHERE id = ?`, [req.params.id]);
  res.json({ ok: true });
}));

module.exports = router;
