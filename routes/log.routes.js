import { Router } from 'express';
import * as logController from '../controllers/logController.js';

const router = Router();

router.get('/', logController.getAllLogs);
router.post('/', logController.createLog);
router.put('/:id', logController.updateLogStatus);

export default router;
