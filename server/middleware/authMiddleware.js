const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'gyanmitra_secret_token_key_123';

exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({ error: 'Not authorized to access this route' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // Contains id and role
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Not authorized, token failed' });
  }
};

exports.restrictTo = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        error: `User role '${req.user.role}' is not authorized to access this route`
      });
    }
    next();
  };
};
