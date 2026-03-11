import { DataTypes } from 'sequelize';
import sequelize from '../config/db.js';
import bcrypt from 'bcryptjs';

// --- User Model ---
const User = sequelize.define('User', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING,
    allowNull: false
  },
  nip: {
    type: DataTypes.STRING,
    unique: true,
    allowNull: false
  },
  password: {
    type: DataTypes.STRING,
    allowNull: false
  },
  role: {
    type: DataTypes.ENUM('ADMIN', 'MANAJEMEN', 'DRIVER', 'KEUANGAN'),
    allowNull: false
  },
  avatar: {
    type: DataTypes.STRING,
    allowNull: true
  }
}, {
  hooks: {
    beforeCreate: async (user) => {
      if (user.password) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    },
    beforeUpdate: async (user) => {
      if (user.changed('password')) {
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(user.password, salt);
      }
    }
  }
});

// --- Vehicle Model ---
const Vehicle = sequelize.define('Vehicle', {
  id: {
    type: DataTypes.STRING, 
    primaryKey: true
  },
  plate: {
    type: DataTypes.STRING,
    allowNull: false
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('ACTIVE', 'STANDBY', 'MAINTENANCE', 'ASSIGNED', 'OFFLINE'),
    defaultValue: 'STANDBY'
  },
  fuelLevel: {
    type: DataTypes.INTEGER,
    defaultValue: 100
  },
  lastServiceDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  taxDueDate: {
    type: DataTypes.DATEONLY,
    allowNull: true
  },
  lastOdometer: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  gpsStatus: {
    type: DataTypes.ENUM('ONLINE', 'OFFLINE'),
    defaultValue: 'OFFLINE'
  },
  lat: {
    type: DataTypes.DOUBLE,
    defaultValue: 0
  },
  lng: {
    type: DataTypes.DOUBLE,
    defaultValue: 0
  },
  heading: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  speed: {
    type: DataTypes.INTEGER,
    defaultValue: 0
  },
  standbyLat: {
    type: DataTypes.DOUBLE,
    defaultValue: -6.2088
  },
  standbyLng: {
    type: DataTypes.DOUBLE,
    defaultValue: 106.8456
  },
  driverId: { 
    type: DataTypes.UUID,
    allowNull: true
  }
});

// --- Task Model ---
const Task = sequelize.define('Task', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  title: {
    type: DataTypes.STRING,
    allowNull: false
  },
  destination: {
    type: DataTypes.STRING,
    allowNull: false
  },
  priority: {
    type: DataTypes.ENUM('HIGH', 'NORMAL'),
    defaultValue: 'NORMAL'
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'ASSIGNED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'),
    defaultValue: 'PENDING'
  },
  notes: {
    type: DataTypes.TEXT,
    allowNull: true
  },
  destinationCoords: {
    type: DataTypes.JSON,
    allowNull: true
  }
});

// --- Log Model ---
const Log = sequelize.define('Log', {
  id: {
    type: DataTypes.STRING,
    primaryKey: true
  },
  type: {
    type: DataTypes.ENUM('FUEL', 'SERVICE'),
    allowNull: false
  },
  date: {
    type: DataTypes.DATE,
    defaultValue: DataTypes.NOW
  },
  amount: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  odometer: {
    type: DataTypes.INTEGER,
    allowNull: false
  },
  status: {
    type: DataTypes.ENUM('PENDING', 'APPROVED', 'REJECTED'),
    defaultValue: 'PENDING'
  },
  imageUrl: {
    type: DataTypes.TEXT('long'), 
    allowNull: true
  }
});

// --- Relationships ---
Vehicle.belongsTo(User, { as: 'driver', foreignKey: 'driverId' });
Task.belongsTo(Vehicle, { foreignKey: 'assignedTo' });
Task.belongsTo(User, { foreignKey: 'driverId' });
Log.belongsTo(Vehicle, { foreignKey: 'vehicleId' });
Log.belongsTo(User, { foreignKey: 'driverId' });

// --- SystemLog Model ---
const SystemLog = sequelize.define('SystemLog', {
  id: {
    type: DataTypes.UUID,
    defaultValue: DataTypes.UUIDV4,
    primaryKey: true
  },
  level: {
    type: DataTypes.ENUM('INFO', 'SUCCESS', 'WARN', 'ERROR'),
    defaultValue: 'INFO'
  },
  type: {
    type: DataTypes.STRING,
    allowNull: false
  },
  message: {
    type: DataTypes.STRING,
    allowNull: false
  }
});

// --- Device Model ---
const Device = sequelize.define('Device', {
  id: {
    type: DataTypes.INTEGER,
    autoIncrement: true,
    primaryKey: true
  },
  name: {
    type: DataTypes.STRING(100),
    allowNull: true
  },
  imei: {
    type: DataTypes.STRING(30),
    unique: true,
    allowNull: true
  }
}, {
  tableName: 'devices',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

// --- Position Model ---
const Position = sequelize.define('Position', {
  id: {
    type: DataTypes.BIGINT,
    autoIncrement: true,
    primaryKey: true
  },
  device_id: {
    type: DataTypes.INTEGER,
    allowNull: true
  },
  latitude: {
    type: DataTypes.DOUBLE,
    allowNull: true
  },
  longitude: {
    type: DataTypes.DOUBLE,
    allowNull: true
  },
  speed: {
    type: DataTypes.DOUBLE,
    allowNull: true
  },
  course: {
    type: DataTypes.DOUBLE,
    allowNull: true
  },
  device_time: {
    type: DataTypes.DATE,
    allowNull: true
  }
}, {
  tableName: 'positions',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: false
});

Device.hasMany(Position, { foreignKey: 'device_id', constraints: false });
Position.belongsTo(Device, { foreignKey: 'device_id', constraints: false });

const db = {
  sequelize,
  User,
  Vehicle,
  Task,
  Log,
  SystemLog,
  Device,
  Position
};

export { User, Vehicle, Task, Log, SystemLog, Device, Position };
export default db;
