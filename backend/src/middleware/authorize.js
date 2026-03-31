const { ROLE_PERMISSIONS } = require('../constants/permissions');

/**
 * Middleware to check if the authenticated user has the required permission.
 * Assumes req.user is populated by authenticateToken middleware.
 */
const authorize = (requiredPermission) => {
  return (req, res, next) => {
    const userRole = req.user?.role;
    
    if (!userRole) {
      return res.status(403).json({ error: 'Access denied: No role assigned' });
    }

    const permissions = ROLE_PERMISSIONS[userRole] || [];
    
    if (permissions.includes(requiredPermission)) {
      return next();
    }

    return res.status(403).json({ 
      error: `Access denied: Missing required permission [${requiredPermission}]` 
    });
  };
};

module.exports = authorize;
