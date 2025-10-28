const jwt = require('jsonwebtoken');

const SECRET_KEY = process.env.JWT_SECRET || 'a-very-secure-secret-key-2025';

const authenticateToken = (req, res, next) => {
  // Check all possible header variations
  const authHeader = req.headers?.authorization || req.headers?.Authorization || req.headers?.Authorization || '';
  console.log('Auth header received:', authHeader);
  const token = authHeader && authHeader.split(' ')[1];
  
  if (!token) {
    console.log('No token provided');
    return res.status(401).json({ message: 'No token provided' });
  }
  
  jwt.verify(token, SECRET_KEY, (err, user) => {
    if (err) {
      console.error('Token verification failed:', err.message);
      return res.status(403).json({ message: 'Invalid token', details: err.message });
    }
    console.log('Token verified successfully. User:', user);
    req.user = user;
    next();
  });
};

// Require one of the allowed roles (case-insensitive match)
const requireRoles = (...allowedRoles) => {
  const normalized = allowedRoles.map(r => String(r).toLowerCase());
  return (req, res, next) => {
    const role = String(req?.user?.role || '').toLowerCase();
    if (!role) {
      return res.status(403).json({ error: 'Access denied: Missing role' });
    }
    if (!normalized.includes(role)) {
      return res.status(403).json({ error: 'Access denied: Insufficient permissions' });
    }
    next();
  };
};

module.exports = { authenticateToken, requireRoles };


