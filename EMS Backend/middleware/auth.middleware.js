import jwt from 'jsonwebtoken';

export const JWT_SECRET = process.env.JWT_SECRET || 'ems_jwt_secret_key_2026_super_secure';

export const verifyToken = (req, res, next) => {
  // 1. All /api/public/* routes remain 100% PUBLIC
  // 2. /api/auth/login route remains PUBLIC
  if (req.path.startsWith('/api/public/') || req.path.startsWith('/api/auth/')) {
    return next();
  }

  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Unauthorized: Valid Bearer JWT token required for private API access.' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (err) {
    return res.status(401).json({ error: 'Unauthorized: Invalid or expired JWT token.' });
  }
};
