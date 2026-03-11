import { Task, Vehicle, SystemLog } from '../models/index.js';

export const getAllTasks = async (req, res) => {
  try {
    const tasks = await Task.findAll();
    res.json(tasks);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const createTask = async (req, res) => {
  try {
    const task = await Task.create(req.body);
    
    if (task.assignedTo) {
      await Vehicle.update({ status: 'ASSIGNED' }, { where: { id: task.assignedTo } });
    }
    
    const taskWithData = await Task.findByPk(task.id);
    
    await SystemLog.create({
      level: 'INFO',
      type: 'TASK',
      message: `Tugas baru '${task.title}' dibuat untuk tujuan ${task.destination}.`
    });

    req.io.emit('data_update', { type: 'TASK', action: 'CREATE', data: taskWithData });
    req.io.emit('new_task', taskWithData);
    
    res.status(201).json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const updateTaskStatus = async (req, res) => {
  try {
    const { id } = req.params;
    const { status, assignedTo, vehicleId, driverId } = req.body;
    
    // Fallback for vehicleId if assignedTo is not present
    const targetVehicleId = assignedTo || vehicleId;
    
    const task = await Task.findByPk(id);
    if (!task) return res.status(404).json({ message: 'Task not found' });

    task.status = status;
    if (targetVehicleId) {
      task.assignedTo = targetVehicleId;
    }
    if (driverId) {
      task.driverId = driverId;
    }
    await task.save();

    if (status === 'IN_PROGRESS' && task.assignedTo) {
      await Vehicle.update(
        { status: 'ACTIVE', driverId: task.driverId || null }, 
        { where: { id: task.assignedTo } }
      );
    } else if (status === 'COMPLETED' || status === 'CANCELLED') {
      if (task.assignedTo) {
        await Vehicle.update(
          { status: 'STANDBY', driverId: null }, 
          { where: { id: task.assignedTo } }
        );
      }
    }

    await SystemLog.create({
      level: status === 'COMPLETED' ? 'SUCCESS' : status === 'CANCELLED' ? 'WARN' : 'INFO',
      type: 'TASK',
      message: `Status tugas '${task.title}' diperbarui menjadi ${status}.`
    });

    req.io.emit('data_update', { type: 'TASK', action: 'UPDATE', data: task });

    // Legacy events support
    if (status === 'IN_PROGRESS') req.io.emit('task_accepted', { taskId: task.id, vehicleId: task.assignedTo });
    if (status === 'COMPLETED') req.io.emit('task_completed', { taskId: task.id, vehicleId: task.assignedTo });

    res.json(task);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
