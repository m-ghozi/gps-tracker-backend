import { Router } from 'express';
import * as systemLogController from '../controllers/systemLogController.js';

const router = Router();

router.get('/', systemLogController.getSystemLogs);

export default router;
