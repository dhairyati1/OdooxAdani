/**
 * Development Auth Middleware
 * 
 * TEMPORARY: For local testing and hackathon only.
 * 
 * This middleware automatically attaches a mock user to all requests
 * in development mode, bypassing the need for JWT authentication.
 * 
 * In production, this should be replaced with proper JWT auth middleware.
 * 
 * Usage: Only active when NODE_ENV !== 'production'
 */

const devAuth = (req, res, next) => {
  // Only run in development mode
  if (process.env.NODE_ENV === 'production') {
    return next();
  }

  // Attach mock user for development/testing
  // This simulates an authenticated manager user
  req.user = {
    id: '694f80df42db4f8af44bd841',
    role: 'manager',
    team: null // Managers may not have a team
  };

  next();
};

module.exports = devAuth;

