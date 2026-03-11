import { Router } from 'express';
import * as taskController from '../controllers/taskController.js';

const router = Router();

router.get('/', taskController.getAllTasks);
router.post('/', taskController.createTask);
router.put('/:id', taskController.updateTaskStatus);

export default router;
