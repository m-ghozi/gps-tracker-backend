import { Log, User, Vehicle, SystemLog } from '../models/index.js';

export const getAllLogs = async (req, res) => {
  try {
    const logs = await Log.findAll({
      include: [
        { model: User, attributes: ['name'] },
        { model: Vehicle, attributes: ['plate'] }
      ],
      order: [['date', 'DESC']]
    });
    res.json(logs);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createLog = async (req, res) => {
  try {
    const log = await Log.create(req.body);
    
    await SystemLog.create({
      level: 'INFO',
      type: 'LOG',
      message: `Permohonan input ${log.type} baru sebesar Rp ${log.amount.toLocaleString()} telah dikirim.`
    });

    req.io.emit('data_update', { type: 'LOG', action: 'CREATE', data: log });
    res.status(201).json(log);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateLogStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;
    
    const [updated] = await Log.update({ status }, { where: { id } });
    
    if (updated) {
      const updatedLog = await Log.findByPk(id);
      
      await SystemLog.create({
        level: status === 'APPROVED' ? 'SUCCESS' : status === 'REJECTED' ? 'WARN' : 'INFO',
        type: 'LOG',
        message: `Status input ${updatedLog.type} menjadi ${status}.`
      });

      req.io.emit('data_update', { type: 'LOG', action: 'UPDATE', data: updatedLog });
      return res.json(updatedLog);
    }
    throw new Error('Log not found');
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
