import { SystemLog } from '../models/index.js';

export const getSystemLogs = async (req, res) => {
  try {
    const logs = await SystemLog.findAll({
      order: [['createdAt', 'DESC']],
      limit: 50
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
