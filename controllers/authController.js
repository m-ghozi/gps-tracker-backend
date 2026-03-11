import { User } from '../models/index.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'secret_carsi_jwt_key_2024';

export const login = async (req, res) => {
  try {
    const { nip, password } = req.body;
    
    // Find user by NIP only
    const user = await User.findOne({ where: { nip } });

    if (!user) {
      return res.status(401).json({ message: 'NIP atau password salah' });
    }

    // Compare input password with hashed password in database
    const isMatch = await bcrypt.compare(password, user.password);
    
    if (!isMatch) {
      return res.status(401).json({ message: 'NIP atau password salah' });
    }

    const { password: _, ...userData } = user.toJSON();
    
    // Generate JWT token
    const token = jwt.sign(
      { id: user.id, role: user.role, nip: user.nip },
      JWT_SECRET,
      { expiresIn: '24h' }
    );
    
    res.json({
      message: 'Login berhasil',
      token,
      user: userData
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Terjadi kesalahan server' });
  }
};
