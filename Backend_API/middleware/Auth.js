const jwt = require('jsonwebtoken');
const { SECRET_KEY } = require('../constants');

const ROLES = {
  ADMIN: 'ADMIN',
  CASHIER: 'CASHIER',
};

const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Formato "Bearer TOKEN"

  if (!token) return res.status(401).send('Acceso denegado');

  jwt.verify(token, SECRET_KEY, (err, decoded) => {
    if (err) return res.status(403).send('Token inválido o expirado');
    
    // Inyectamos los datos del token en el request
    req.user = decoded; 
    next();
  });
};

/**
 * After authenticateToken, checks that req.user.roleCode is allowed.
 * Usage: authorizeRoles(ROLES.ADMIN) or authorizeRoles(ROLES.ADMIN, ROLES.CASHIER)
 */
const authorizeRoles = (...allowedRoles) => (req, res, next) => {
  const roleCode = req.user?.roleCode;

  if (!roleCode || !allowedRoles.includes(roleCode)) {
    return res.status(403).json({
      ok: false,
      message: 'No tienes permisos para esta acción',
    });
  }

  next();
};

module.exports = {
  ROLES,
  authenticateToken,
  authorizeRoles,
};
