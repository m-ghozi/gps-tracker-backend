import { Router } from 'express';
import * as gpsDeviceController from '../controllers/gpsDeviceController.js';
import * as gpsPositionController from '../controllers/gpsPositionController.js';

const router = Router();

router.get('/devices', gpsDeviceController.getDevices);
router.post('/devices', gpsDeviceController.registerDevice);
router.get('/positions/latest', gpsPositionController.getLatestPositions);
router.get('/positions/:imei/history', gpsPositionController.getPositionHistory);

export default router;
