# GPS Tracker Backend Server

Backend server untuk sistem monitoring kendaraan berbasis GPS secara real-time. Menggunakan **Express.js** untuk REST API, **Socket.IO** untuk live update, dan **TCP Server** untuk menerima data langsung dari perangkat GPS tracker fisik.

---

## 🚀 Tech Stack

| Teknologi | Kegunaan |
|---|---|
| Node.js + Express.js | REST API server |
| Socket.IO | Real-time update ke client |
| Sequelize + MySQL | ORM & database |
| TCP Server (net) | Menerima data langsung dari GPS device |
| JWT + bcryptjs | Autentikasi & enkripsi password |
| dotenv | Manajemen environment variable |

---

## 📁 Struktur Proyek

```
gps-server/
├── index.js              # Entry point — HTTP + Socket.IO + route mounting
├── config/
│   └── db.js             # Konfigurasi koneksi Sequelize
├── routes/               # Route definitions per fitur
│   ├── auth.routes.js
│   ├── gps.routes.js
│   ├── user.routes.js
│   ├── vehicle.routes.js
│   ├── task.routes.js
│   ├── log.routes.js
│   └── systemLog.routes.js
├── controllers/          # Business logic per fitur
│   ├── authController.js
│   ├── gpsDeviceController.js
│   ├── gpsPositionController.js
│   ├── vehicleController.js
│   ├── taskController.js
│   ├── logController.js
│   ├── userController.js
│   └── systemLogController.js
├── middleware/
│   └── authMiddleware.js  # JWT verification
├── models/
│   └── index.js           # Semua model Sequelize
├── tcp/
│   └── tcpServer.js       # TCP server untuk GPS device fisik
├── utils/
│   └── gpsParser.js       # Parser payload dari GPS tracker
└── scripts/               # Script developer (bukan bagian app)
    ├── seed.js            # Isi data awal ke database
    └── test_gps.js        # Test koneksi TCP & endpoint GPS
```

---

## ⚙️ Konfigurasi

Buat file `.env` di root proyek:

```env
DB_HOST=127.0.0.1
DB_USER=root
DB_PASS=your_password
DB_NAME=tracker
DB_DIALECT=mysql
PORT=4444
TCP_PORT=5023
JWT_SECRET=your_jwt_secret_key
```

---

## 📦 Instalasi & Menjalankan

```bash
# Install dependencies
npm install

# Isi data awal ke database
npm run seed

# Jalankan server (development, auto-reload)
npm run dev

# Jalankan server (production)
npm start
```

Server berjalan di:
- **HTTP API**: `http://localhost:4444`
- **TCP (GPS Device)**: port `5023`

---

## 🔌 Format Data GPS (TCP)

Perangkat GPS mengirim data ke port TCP dalam format proprietary:

```
(IMEI BR DDMMYYYY [A/V] LAT[N/S] LON[E/W] SSS.SS HMMSS CCC.CC ...FLAGS)
```

**Contoh payload:**
```
(028044674594BR00260311A0026.9101S10035.2144E000.0055843000.0001000000L00000000)
```

| Field | Contoh | Keterangan |
|---|---|---|
| IMEI | `028044674594` | Identitas unik perangkat (12 digit) |
| Validity | `A` | `A` = valid fix, `V` = invalid |
| Latitude | `0026.9101S` | DDMM.MMMM + arah |
| Longitude | `10035.2144E` | DDDMM.MMMM + arah |
| Speed | `000.00` | Kecepatan dalam knot (dikonversi ke km/h) |
| Time | `55843` | HMMSS UTC (5 digit) |
| Course | `000.00` | Arah kompas dalam derajat |

---

## 🌐 REST API Endpoints

### Auth
| Method | Endpoint | Auth | Deskripsi |
|---|---|---|---|
| POST | `/api/auth/login` | ❌ | Login, mengembalikan JWT token |

### GPS Tracker *(tidak perlu auth)*
| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/devices` | Daftar semua perangkat GPS terdaftar |
| POST | `/api/devices` | Registrasi perangkat GPS baru |
| GET | `/api/positions/latest` | Posisi terkini semua perangkat |
| GET | `/api/positions/:imei/history` | Riwayat posisi perangkat (opsional: `?start=&end=`) |

### Users *(JWT required)*
| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/users` | Daftar semua user |
| POST | `/api/users` | Buat user baru |
| PUT | `/api/users/:id` | Update user |
| DELETE | `/api/users/:id` | Hapus user |

### Kendaraan *(JWT required)*
| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/vehicles` | Semua kendaraan |
| POST | `/api/vehicles` | Tambah kendaraan |
| PUT | `/api/vehicles/:id` | Update kendaraan |
| DELETE | `/api/vehicles/:id` | Hapus kendaraan |

### Tugas *(JWT required)*
| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/tasks` | Semua tugas |
| POST | `/api/tasks` | Buat tugas baru |
| PUT | `/api/tasks/:id` | Update status tugas |

### Log Keuangan *(JWT required)*
| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/logs` | Semua log (BBM/servis) |
| POST | `/api/logs` | Buat log baru |
| PUT | `/api/logs/:id` | Update status log |

### System Log *(JWT required)*
| Method | Endpoint | Deskripsi |
|---|---|---|
| GET | `/api/system-logs` | Log aktivitas sistem |

---

## 📡 Socket.IO Events

### Client → Server
| Event | Payload | Deskripsi |
|---|---|---|
| `register` | `{ userId, role }` | Daftarkan client |
| `gps_update` | `{ vehicleId, position, speed, heading }` | Update GPS manual |
| `new_task` | task object | Broadcast tugas baru |
| `task_accepted` | data | Broadcast tugas diterima |
| `task_completed` | data | Broadcast tugas selesai |

### Server → Client
| Event | Deskripsi |
|---|---|
| `gps_update` | Posisi GPS diperbarui |
| `new_task` | Ada tugas baru |
| `task_accepted` | Tugas diterima driver |
| `task_completed` | Tugas diselesaikan |
| `data_update` | Data berubah (log, tugas, dll) |

---

## 🔐 Autentikasi

Semua endpoint di bawah `/api` (kecuali `/api/auth/login` dan endpoint GPS) memerlukan JWT token.

```
Authorization: Bearer <token>
```

---

## 🗄️ Database

| Tabel | Keterangan |
|---|---|
| `Users` | Pengguna sistem (ADMIN, MANAJEMEN, DRIVER, KEUANGAN) |
| `Vehicles` | Data kendaraan + status GPS live |
| `Tasks` | Data penugasan kendaraan |
| `Logs` | Log pengisian BBM & servis |
| `SystemLogs` | Log aktivitas sistem |
| `devices` | Perangkat GPS tracker terdaftar |
| `positions` | Histori posisi GPS dari perangkat |
