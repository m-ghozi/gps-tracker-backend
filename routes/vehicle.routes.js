import { Router } from 'express';
import * as vehicleController from '../controllers/vehicleController.js';

const router = Router();

router.get('/', vehicleController.getAllVehicles);
router.post('/', vehicleController.createVehicle);
router.put('/:id', vehicleController.updateVehicle);
router.delete('/:id', vehicleController.deleteVehicle);

export default router;
