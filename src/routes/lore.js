const express = require('express');
const router = express.Router();
const { pool } = require('../db');
const { requireAdmin } = require('../middleware/auth');
const { asyncHandler } = require('../utils/asyncHandler');

// Public: full timeline, in chronological/display order
router.get('/', asyncHandler(async (req, res) => {
  const [rows] = await pool.query(`SELECT * FROM lore_entries ORDER BY sort_order ASC, created_at ASC`);
  res.json(rows);
}));

router.get('/:id', asyncHandler(async (req, res) => {
  const [[entry]] = await pool.query(`SELECT * FROM lore_entries WHERE id = ?`, [req.params.id]);
  if (!entry) return res.status(404).json({ error: 'Lore entry not found' });
  res.json(entry);
}));

// Admin: add a new timeline entry
router.post('/', requireAdmin, asyncHandler(async (req, res) => {
  const { era_label, title, content, sort_order } = req.body;
  const [result] = await pool.query(
    `INSERT INTO lore_entries (era_label, title, content, sort_order) VALUES (?, ?, ?, ?)`,
    [era_label, title, content, sort_order || 0]
  );
  res.status(201).json({ id: result.insertId });
}));

router.patch('/:id', requireAdmin, asyncHandler(async (req, res) => {
  const { era_label, title, content, sort_order } = req.body;
  await pool.query(
    `UPDATE lore_entries SET era_label = ?, title = ?, content = ?, sort_order = ? WHERE id = ?`,
    [era_label, title, content, sort_order || 0, req.params.id]
  );
  res.json({ ok: true });
}));

router.delete('/:id', requireAdmin, asyncHandler(async (req, res) => {
  await pool.query(`DELETE FROM lore_entries WHERE id = ?`, [req.params.id]);
  res.json({ ok: true });
}));

module.exports = router;
