const jwt = require('jsonwebtoken');
const db = require('../config/database'); 

exports.verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'No token provided' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'yourSecretKey');
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(403).json({ message: 'Invalid or expired token' });
  }
};

exports.isAuthenticatedUser = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];
  const tabContext = req.headers['x-tab-context'];

  if (!token) {
    return res.status(401).json({ 
      success: false,
      message: 'Authorization token required' 
    });
  }

  jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
    if (err) {
      return res.status(403).json({ 
        success: false,
        message: err.name === 'TokenExpiredError' 
          ? 'Session expired. Please login again'
          : 'Invalid authentication token'
      });
    }

    if (tabContext) {
      if (decoded.role === 'admin' && tabContext !== 'admin') {
        return res.status(403).json({
          success: false,
          message: 'Admin accounts must use the admin interface'
        });
      }
      
      if (decoded.role === 'user' && tabContext !== 'user') {
        return res.status(403).json({
          success: false,
          message: 'User accounts must use the user interface'
        });
      }
    }

    req.user = decoded;
    next();
  });
};

// Fixed isAdmin with database fallback
exports.isAdmin = (req, res, next) => {
  if (req.user.role && req.user.role.toLowerCase() === 'admin') {
    return next();
  }

  const userId = req.user.id;
  db.query(
    'SELECT role FROM users WHERE id = ?',
    [userId],
    (err, results) => {
      if (err) {
        return res.status(500).json({ 
          success: false,
          message: 'Database error',
          error: err.message 
        });
      }

      if (results.length === 0) {
        return res.status(403).json({ 
          success: false,
          message: 'User account not found' 
        });
      }

      const userRole = results[0].role.toLowerCase();
      req.user.role = userRole;

      if (userRole !== 'admin') {
        return res.status(403).json({ 
          success: false,
          message: 'Admin privileges required' 
        });
      }

      next();
    }
  );
};

// ✅ Role-based middleware
exports.authorizeRoles = (...roles) => {
  return (req, res, next) => {
    try {
      if (!req.user || !req.user.role) {
        return res.status(403).json({
          success: false,
          message: 'User role not determined'
        });
      }

      const userRole = req.user.role.toLowerCase();
      const allowedRoles = roles.map(r => r.toLowerCase());

      if (!allowedRoles.includes(userRole)) {
        return res.status(403).json({
          success: false,
          message: `Role (${req.user.role}) is not authorized`
        });
      }

      next();
    } catch (error) {
      console.error('Authorization error:', error);
      return res.status(500).json({
        success: false,
        message: 'Authorization check failed'
      });
    }
  };
};

// ✅ Tab context validator
exports.validateTabContext = (requiredContext) => {
  return (req, res, next) => {
    const tabContext = req.headers['x-tab-context'];
    
    if (!tabContext) {
      return next();
    }

    if (tabContext !== requiredContext) {
      return res.status(403).json({
        success: false,
        message: `This resource requires ${requiredContext} interface`
      });
    }

    next();
  };
};
