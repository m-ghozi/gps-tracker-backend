import { User } from '../models/index.js';

export const getUsers = async (req, res) => {
  try {
    const users = await User.findAll({
      attributes: { exclude: ['password'] } // Don't send passwords back
    });
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createUser = async (req, res) => {
  try {
    const user = await User.create(req.body);
    const userWithoutPassword = user.toJSON();
    delete userWithoutPassword.password;
    req.io.emit('data_update', { type: 'USER', action: 'CREATE', data: userWithoutPassword });
    res.status(201).json(userWithoutPassword);
  } catch (error) {
    console.error("Create User Error:", error);
    res.status(400).json({ message: error.message });
  }
};

export const updateUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    // If updating password, it should be hashed in a real app (omitted here for brevity/consistency with current scope)
    await user.update(req.body);
    
    const updatedUser = user.toJSON();
    delete updatedUser.password;
    
    req.io.emit('data_update', { type: 'USER', action: 'UPDATE', data: updatedUser });
    res.json(updatedUser);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

export const deleteUser = async (req, res) => {
  try {
    const user = await User.findByPk(req.params.id);
    if (!user) return res.status(404).json({ message: 'User not found' });
    
    await user.destroy();
    req.io.emit('data_update', { type: 'USER', action: 'DELETE', id: req.params.id });
    res.json({ message: 'User deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
