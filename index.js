import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './models/index.js';
import * as authController from './controllers/authController.js';
import * as vehicleController from './controllers/vehicleController.js';
import * as taskController from './controllers/taskController.js';
import * as logController from './controllers/logController.js';
import * as userController from './controllers/userController.js';
import * as systemLogController from './controllers/systemLogController.js';
import { verifyToken } from './middleware/authMiddleware.js';

// GPS Tracker Imports
import * as gpsDeviceController from './controllers/gpsDeviceController.js';
import * as gpsPositionController from './controllers/gpsPositionController.js';
import startTcpServer from './tcpServer.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);



const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: "*",
    methods: ["GET", "POST", "PUT", "DELETE"]
  }
});

app.use(cors());
app.use(express.json());

// Middleware to pass io to controllers
app.use((req, res, next) => {
  req.io = io;
  next();
});

// Auth Routes (Unprotected)
app.post('/api/auth/login', authController.login);

// GPS Tracker API Routes (Unprotected)
app.get('/api/devices', gpsDeviceController.getDevices);
app.post('/api/devices', gpsDeviceController.registerDevice);
app.get('/api/positions/latest', gpsPositionController.getLatestPositions);
app.get('/api/positions/:imei/history', gpsPositionController.getPositionHistory);

// Apply auth middleware to all routes below this line
app.use('/api', verifyToken);

// User Routes
app.get('/api/users', userController.getUsers);
app.post('/api/users', userController.createUser);
app.put('/api/users/:id', userController.updateUser);
app.delete('/api/users/:id', userController.deleteUser);

// Vehicle Routes
app.get('/api/vehicles', vehicleController.getAllVehicles);
app.post('/api/vehicles', vehicleController.createVehicle);
app.put('/api/vehicles/:id', vehicleController.updateVehicle);
app.delete('/api/vehicles/:id', vehicleController.deleteVehicle);

// Task Routes
app.get('/api/tasks', taskController.getAllTasks);
app.post('/api/tasks', taskController.createTask);
app.put('/api/tasks/:id', taskController.updateTaskStatus);

// Log Routes
app.get('/api/logs', logController.getAllLogs);
app.post('/api/logs', logController.createLog);
app.put('/api/logs/:id', logController.updateLogStatus);

// System Log Routes
app.get('/api/system-logs', systemLogController.getSystemLogs);

// Socket.IO Logic
const connectedClients = new Map();

io.on('connection', (socket) => {
  console.log('Client connected:', socket.id);

  socket.on('register', (data) => {
    const { userId, role } = data;
    connectedClients.set(userId, { socketId: socket.id, role });
    console.log(`User ${userId} registered as ${role}`);
  });

  socket.on('gps_update', async (data) => {
    io.emit('gps_update', data);
    try {
      await db.Vehicle.update({
        lat: data.position.lat,
        lng: data.position.lng,
        speed: data.speed,
        heading: data.heading,
        gpsStatus: 'ONLINE'
      }, { where: { id: data.vehicleId } });
    } catch (err) {
      console.error('Failed to update vehicle GPS in DB:', err);
    }
  });

  socket.on('new_task', (taskData) => {
    io.emit('new_task', taskData);
  });

  socket.on('task_accepted', (data) => {
    io.emit('task_accepted', data);
  });

  socket.on('task_completed', (data) => {
    io.emit('task_completed', data);
  });

  socket.on('disconnect', () => {
    console.log('Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 4444;

db.sequelize.sync({ alter: true }).then(() => {
  console.log('Database synced');
  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  // Start TCP Server for GPS Tracker
  startTcpServer();
}).catch(err => {
  console.error('Failed to sync database:', err);
});
