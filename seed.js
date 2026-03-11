import db from './models/index.js';
import { User, Vehicle } from './models/index.js';

const seed = async () => {
  try {
    await db.sequelize.sync({ force: true }); // Reset DB

    console.log('Database resetted. Seeding data...');

    // Users
    const admin = await User.create({
      name: 'Admin System',
      nip: '45678',
      password: 'admin123', // In real app, hash this!
      role: 'ADMIN',
      avatar: 'https://ui-avatars.com/api/?name=Admin+System&background=ef4444&color=fff'
    });

    const manager = await User.create({
      name: 'Andi Wijaya',
      nip: '23456',
      password: 'dispatch123',
      role: 'MANAJEMEN',
      avatar: 'https://ui-avatars.com/api/?name=Andi+Wijaya&background=3b82f6&color=fff'
    });

    const driver = await User.create({
      name: 'Budi Santoso',
      nip: '12345',
      password: 'driver123',
      role: 'DRIVER',
      avatar: 'https://ui-avatars.com/api/?name=Budi+Santoso&background=10b981&color=fff'
    });
    
    const finance = await User.create({
      name: 'Siti Aminah',
      nip: '34567',
      password: 'manager123',
      role: 'KEUANGAN',
      avatar: 'https://ui-avatars.com/api/?name=Siti+Aminah&background=8b5cf6&color=fff'
    });

    // Vehicles
    await Vehicle.create({
      id: 'v1',
      plate: 'B 1234 AB',
      type: 'AMBULANCE',
      status: 'STANDBY',
      lastServiceDate: '2023-10-01',
      taxDueDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0], // 1 year from now
      fuelLevel: 85,
      driverId: driver.id
    });

    await Vehicle.create({
      id: 'v2',
      plate: 'B 5678 CD',
      type: 'OPERATIONAL',
      status: 'ACTIVE',
      lastServiceDate: '2023-09-15',
      taxDueDate: new Date(new Date().setDate(new Date().getDate() + 15)).toISOString().split('T')[0], // 15 days from now (warning)
      fuelLevel: 60
    });

    console.log('Seeding completed!');
    process.exit(0);
  } catch (err) {
    console.error('Seeding failed:', err);
    process.exit(1);
  }
};

seed();
