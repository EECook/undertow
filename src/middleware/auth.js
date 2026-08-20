const jwt = require('jsonwebtoken');

// Reads the session from either the httpOnly cookie (set on Discord login)
// or an Authorization: Bearer header (kept for API/script use). Attaches
// the decoded payload to req.user: { id, discord_id, role, ... }.
function requireAuth(req, res, next) {
  const cookieToken = req.cookies && req.cookies.undertow_session;
  const header = req.headers.authorization || '';
  const headerToken = header.startsWith('Bearer ') ? header.slice(7) : null;
  const token = cookieToken || headerToken;

  if (!token) return res.status(401).json({ error: 'Not logged in' });

  try {
    req.user = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Invalid or expired session' });
  }
}

// role tiers, low to high
const ROLE_RANK = { resident: 0, moderator: 1, admin: 2 };

// requireRole('moderator') passes for moderators AND admins (>= that tier).
// Returns an array of two middleware — Express flattens arrays passed as a
// route handler arg, so this drops into routes exactly like a single
// middleware function would: router.delete('/:id', requireRole('admin'), ...)
function requireRole(minRole) {
  return [
    requireAuth,
    (req, res, next) => {
      const userRank = ROLE_RANK[req.user.role] ?? 0;
      if (userRank < ROLE_RANK[minRole]) {
        return res.status(403).json({ error: `Requires ${minRole} role or higher` });
      }
      next();
    },
  ];
}

// Alias kept so existing route files (gallery/news/rules) that import
// requireAdmin don't need to change — it's just requireRole('admin').
const requireAdmin = requireRole('admin');

module.exports = { requireAuth, requireRole, requireAdmin, ROLE_RANK };
