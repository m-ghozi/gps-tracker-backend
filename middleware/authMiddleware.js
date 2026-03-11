import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret_carsi_jwt_key_2024';

export const verifyToken = (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ message: 'Tidak ada token akses, otorisasi ditolak!' });
  }

  const token = authHeader.split(' ')[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded; // add user id/role to request
    next();
  } catch (error) {
    return res.status(403).json({ message: 'Token tidak valid atau sudah kadaluarsa.' });
  }
};
