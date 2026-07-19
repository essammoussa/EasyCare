// Middleware to check if user has required role for a route
// Used with authMiddleware - assumes req.user is already populated
// Example: router.delete('/admin/users/:id', authMiddleware, roleMiddleware(['admin']), deleteUser);
const roleMiddleware = (allowedRoles) => {
  return (req, res, next) => {
    // Make sure user is authenticated first
    if (!req.user) {
      return res.status(401).json({ message: 'Authorization required' });
    }

    // Check if user's role is in the list of allowed roles
    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({ message: 'Access denied: insufficient permissions' });
    }

    // User has required role, continue to next handler
    next();
  };
};

module.exports = roleMiddleware;
