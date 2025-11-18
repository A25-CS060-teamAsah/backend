/**
 * Role-Based Access Control (RBAC) Middleware
 * Team A25-CS060
 * 
 * Protects routes based on user roles
 */

/**
 * Check if user has required role(s)
 * @param {Array|String} allowedRoles - Role(s) that can access the route
 * @returns {Function} Express middleware
 * 
 * @example
 * // Single role
 * router.post('/admin', requireRole('admin'), adminController.doSomething);
 * 
 * // Multiple roles
 * router.get('/data', requireRole(['admin', 'manager']), dataController.getData);
 */
export const requireRole = (allowedRoles) => {
  return (req, res, next) => {
    try {
      console.log('🔐 RBAC Middleware - requireRole called');
      console.log('   Required roles:', allowedRoles);
      console.log('   User object:', req.user);

      // User should be attached by authMiddleware
      if (!req.user) {
        console.log('   ❌ No user object found - returning 401');
        return res.status(401).json({
          success: false,
          error: 'Unauthorized',
          message: 'User not authenticated'
        });
      }

      const userRole = req.user.role;
      console.log('   User role:', userRole);

      // Convert single role to array for consistent handling
      const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];
      console.log('   Roles array:', rolesArray);

      // Check if user's role is in allowed roles
      if (!rolesArray.includes(userRole)) {
        console.log('   ❌ Role check FAILED - Access denied');
        return res.status(403).json({
          success: false,
          error: 'Forbidden',
          message: `Access denied. Required role(s): ${rolesArray.join(', ')}. Your role: ${userRole}`
        });
      }

      // User has required role, proceed
      console.log('   ✅ Role check PASSED - Proceeding to next middleware');
      next();
    } catch (error) {
      console.error('RBAC Error:', error);
      return res.status(500).json({
        success: false,
        error: 'Server Error',
        message: 'Role verification failed'
      });
    }
  };
};

/**
 * Check if user is admin
 * Shorthand for requireRole('admin')
 */
export const requireAdmin = () => requireRole('admin');

/**
 * Check if user is sales or admin
 * Shorthand for requireRole(['admin', 'sales'])
 */
export const requireSalesOrAdmin = () => requireRole(['admin', 'sales']);

/**
 * Check if user is manager or admin
 * Shorthand for requireRole(['admin', 'manager'])
 */
export const requireManagerOrAdmin = () => requireRole(['admin', 'manager']);
