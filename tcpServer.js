import net from 'net';
import db from './models/index.js';
import { parse } from './utils/gpsParser.js';

const startTcpServer = () => {
    const TCP_PORT = process.env.TCP_PORT || 5023;

    const server = net.createServer((socket) => {
        console.log(`[TCP] Client connected: ${socket.remoteAddress}:${socket.remotePort}`);

        socket.on('data', async (data) => {
            try {
                const payload = data.toString().trim();
                console.log(`[TCP] Received data: ${payload}`);

                if (!payload) return;

                const parsedData = parse(payload);
                
                if (parsedData) {
                    const { imei, latitude, longitude, speed, course } = parsedData;

                    // Find device
                    const device = await db.Device.findOne({ where: { imei } });
                    
                    if (device) {
                        await db.Position.create({
                            device_id: device.id,
                            latitude,
                            longitude,
                            speed,
                            course,
                            device_time: new Date() // Fallback time since not in parser
                        });
                        console.log(`[TCP] Position inserted for IMEI ${imei}`);
                        socket.write('OK\\n');
                    } else {
                        console.log(`[TCP] Unknown device IMEI: ${imei}`);
                        socket.write('UNKNOWN_DEVICE\\n');
                    }
                } else {
                     console.log(`[TCP] Invalid payload format or unparseable: ${payload}`);
                     socket.write('INVALID_FORMAT\\n');
                }
            } catch (err) {
                console.error(`[TCP] Error processing data:`, err.message);
            }
        });

        socket.on('close', () => {
            console.log(`[TCP] Client disconnected`);
        });

        socket.on('error', (err) => {
            console.error(`[TCP] Socket error:`, err.message);
        });
    });

    server.listen(TCP_PORT, () => {
        console.log(`TCP Server listening on port ${TCP_PORT}`);
    });
};

export default startTcpServer;
