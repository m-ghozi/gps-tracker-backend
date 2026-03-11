import db from '../models/index.js';

export const getDevices = async (req, res) => {
  try {
    const devices = await db.Device.findAll();
    res.json(devices);
  } catch (error) {
    console.error('Error fetching devices:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const registerDevice = async (req, res) => {
  try {
    const { name, imei } = req.body;
    
    if (!imei) {
      return res.status(400).json({ error: 'IMEI is required' });
    }

    const existingDevice = await db.Device.findOne({ where: { imei } });
    if (existingDevice) {
      return res.status(409).json({ error: 'Device with this IMEI already exists' });
    }

    await db.Device.create({ name, imei });
    res.status(201).json({ message: 'Device registered' });
  } catch (error) {
    console.error('Error registering device:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
