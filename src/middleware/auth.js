const jwt = require('jsonwebtoken');

// Minimal auth for now: a single admin login (env-configured) issues a JWT.
// This is a placeholder — when Discord OAuth account linking is wired up
// (matching the pattern from the Halloweentown site), swap this for real
// per-user sessions and check `req.user.role` instead of a single admin flag.

function requireAdmin(req, res, next) {
  const header = req.headers.authorization || '';
  const token = header.startsWith('Bearer ') ? header.slice(7) : null;
  if (!token) return res.status(401).json({ error: 'Missing token' });

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    if (payload.role !== 'admin') return res.status(403).json({ error: 'Admin access required' });
    req.user = payload;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired token' });
  }
}

module.exports = { requireAdmin };
