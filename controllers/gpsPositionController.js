import db from '../models/index.js';

export const getLatestPositions = async (req, res) => {
  try {
    const query = `
      SELECT d.imei, d.name, p.latitude, p.longitude, p.speed, p.course, p.device_time
      FROM devices d
      JOIN positions p ON p.device_id = d.id
      WHERE p.device_time = (
          SELECT MAX(device_time) FROM positions p2 WHERE p2.device_id = d.id
      )
    `;
    const results = await db.sequelize.query(query, {
      type: db.sequelize.QueryTypes.SELECT
    });
    
    res.json(results);
  } catch (error) {
    console.error('Error fetching latest positions:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

export const getPositionHistory = async (req, res) => {
  try {
    const { imei } = req.params;
    const { start, end } = req.query;

    let query = `
      SELECT p.latitude, p.longitude, p.speed, p.course, p.device_time
      FROM positions p
      JOIN devices d ON p.device_id = d.id
      WHERE d.imei = :imei
    `;
    
    const replacements = { imei };

    if (start) {
      query += ` AND p.device_time >= :start`;
      replacements.start = start;
    }
    if (end) {
      query += ` AND p.device_time <= :end`;
      replacements.end = end;
    }
    
    query += ` ORDER BY p.device_time DESC`;

    const results = await db.sequelize.query(query, {
      replacements,
      type: db.sequelize.QueryTypes.SELECT
    });
    
    res.json(results);
  } catch (error) {
    console.error('Error fetching position history:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};
