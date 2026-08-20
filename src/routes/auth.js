const express = require('express');
const router = express.Router();
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');

// Single admin login for now. See src/middleware/auth.js for the plan to
// replace this with real per-resident sessions later.
router.post('/admin-login', async (req, res) => {
  const { username, password } = req.body;

  if (username !== process.env.ADMIN_USERNAME) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const match = await bcrypt.compare(password || '', process.env.ADMIN_PASSWORD_HASH || '');
  if (!match) return res.status(401).json({ error: 'Invalid credentials' });

  const token = jwt.sign({ role: 'admin', username }, process.env.JWT_SECRET, { expiresIn: '12h' });
  res.json({ token });
});

module.exports = router;
