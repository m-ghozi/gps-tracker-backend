import 'dotenv/config';
import express from 'express';
import { createServer } from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import db from './models/index.js';
import { verifyToken } from './middleware/authMiddleware.js';

// Routes
import authRoutes from './routes/auth.routes.js';
import gpsRoutes from './routes/gps.routes.js';
import userRoutes from './routes/user.routes.js';
import vehicleRoutes from './routes/vehicle.routes.js';
import taskRoutes from './routes/task.routes.js';
import logRoutes from './routes/log.routes.js';
import systemLogRoutes from './routes/systemLog.routes.js';

// TCP Server
import startTcpServer from './tcp/tcpServer.js';

const app = express();
const httpServer = createServer(app);
const io = new Server(httpServer, {
  cors: {
    origin: '*',
    methods: ['GET', 'POST', 'PUT', 'DELETE']
  }
});

app.use(cors());
app.use(express.json());

// Pass socket.io instance to all controllers via request
app.use((req, res, next) => {
  req.io = io;
  next();
});

// ─── Public Routes ────────────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api', gpsRoutes);

// ─── Protected Routes (JWT required) ─────────────────────────────────────────
app.use('/api', verifyToken);
app.use('/api/users', userRoutes);
app.use('/api/vehicles', vehicleRoutes);
app.use('/api/tasks', taskRoutes);
app.use('/api/logs', logRoutes);
app.use('/api/system-logs', systemLogRoutes);

// ─── Socket.IO ────────────────────────────────────────────────────────────────
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

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 4444;

db.sequelize.sync({ alter: true }).then(() => {
  console.log('Database synced');
  httpServer.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });

  // Start TCP Server for GPS Tracker (pass io for real-time broadcast)
  startTcpServer(io);
}).catch(err => {
  console.error('Failed to sync database:', err);
});
