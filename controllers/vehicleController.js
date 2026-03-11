import { Vehicle, User } from '../models/index.js';

export const getAllVehicles = async (req, res) => {
  try {
    const vehicles = await Vehicle.findAll({
      include: [{ model: User, as: 'driver', attributes: ['name', 'nip'] }]
    });
    res.json(vehicles);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createVehicle = async (req, res) => {
  try {
    const payload = { ...req.body };
    if (payload.location) {
      payload.lat = payload.location.lat;
      payload.lng = payload.location.lng;
    }
    
    // Sync with standby if needed
    if (payload.standbyLocation) {
        payload.standbyLat = payload.standbyLocation.lat;
        payload.standbyLng = payload.standbyLocation.lng;
        
        if (payload.status === 'STANDBY' && (!payload.lat || !payload.lng)) {
            payload.lat = payload.standbyLat;
            payload.lng = payload.standbyLng;
        }
    }

    const vehicle = await Vehicle.create(payload);
    req.io.emit('data_update', { type: 'VEHICLE', action: 'CREATE', data: vehicle });
    res.status(201).json(vehicle);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const payload = { ...req.body };
    
    // Flatten location objects for DB
    if (payload.location) {
      payload.lat = payload.location.lat;
      payload.lng = payload.location.lng;
    }
    if (payload.standbyLocation) {
      payload.standbyLat = payload.standbyLocation.lat;
      payload.standbyLng = payload.standbyLocation.lng;
      
      // If status is STANDBY or becoming STANDBY, sync current lat/lng to standby coordinates
      if (payload.status === 'STANDBY') {
        payload.lat = payload.standbyLat;
        payload.lng = payload.standbyLng;
      }
    } else if (payload.status === 'STANDBY') {
      // If no new standbyLocation provided but status is explicitly set to STANDBY,
      // try to sync with existing standby coordinates if they are available in payload or DB
      // We'll handle the DB part after getting the vehicle
    }

    // Check if vehicle exists first to give better error
    const vehicle = await Vehicle.findByPk(id);
    if (!vehicle) {
      return res.status(404).json({ message: `Vehicle with ID ${id} not found` });
    }

    // If status is STANDBY and no lat/lng was in payload, sync from standbyLat/standbyLng (either in payload or vehicle)
    if (payload.status === 'STANDBY') {
        if (!payload.lat) payload.lat = payload.standbyLat || vehicle.standbyLat;
        if (!payload.lng) payload.lng = payload.standbyLng || vehicle.standbyLng;
    }

    await Vehicle.update(payload, { where: { id } });
    
    const updatedVehicle = await Vehicle.findByPk(id, {
      include: [{ model: User, as: 'driver', attributes: ['name', 'nip'] }]
    });
    
    if (updatedVehicle) {
      req.io.emit('data_update', { type: 'VEHICLE', action: 'UPDATE', data: updatedVehicle });
      return res.json(updatedVehicle);
    }
    
    res.status(404).json({ message: 'Vehicle not found after update' });
  } catch (error) {
    console.error("Update Vehicle Error:", error);
    res.status(500).json({ message: error.message });
  }
};

export const deleteVehicle = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Vehicle.destroy({ where: { id } });
    if (deleted) {
      req.io.emit('data_update', { type: 'VEHICLE', action: 'DELETE', id });
      return res.status(204).send("Vehicle deleted");
    }
    throw new Error("Vehicle not found");
  } catch (error) {
    return res.status(500).send(error.message);
  }
};
