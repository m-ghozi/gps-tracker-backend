import http from 'http';
import net from 'net';

const HTTP_PORT = process.env.PORT || 4444;
const TCP_PORT = process.env.TCP_PORT || 5023;
const HOST = '127.0.0.1';

const delay = ms => new Promise(res => setTimeout(res, ms));

async function runTests() {
  console.log('--- Registering Device ---');
  await new Promise((resolve) => {
    const req = http.request({
      hostname: HOST,
      port: HTTP_PORT,
      path: '/api/devices',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`Status: ${res.statusCode}`);
        console.log(`Response: ${data}`);
        resolve();
      });
    });
    req.write(JSON.stringify({ name: 'Test Vehicle 1', imei: '888888888888888' }));
    req.end();
  });

  await delay(500);

  console.log('\n--- Sending TCP Data ---');
  await new Promise((resolve) => {
    const client = new net.Socket();
    client.connect(TCP_PORT, HOST, () => {
      console.log('Connected to TCP server');
      // Send a sample GPS packet in the proprietary format
      client.write('(888888888888888BR00260311A0026.9101S10035.2144E000.0055843000.0001000000L00000000)');
    });

    client.on('data', (data) => {
      console.log('Received from TCP:', data.toString());
      client.destroy();
    });

    client.on('close', () => {
      console.log('TCP Connection closed');
      resolve();
    });
  });

  await delay(1000);

  console.log('\n--- Fetching Latest Positions ---');
  await new Promise((resolve) => {
    http.get(`http://${HOST}:${HTTP_PORT}/api/positions/latest`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`Response: ${data}`);
        resolve();
      });
    });
  });

  console.log('\n--- Fetching Position History ---');
  await new Promise((resolve) => {
    http.get(`http://${HOST}:${HTTP_PORT}/api/positions/888888888888888/history`, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        console.log(`Response: ${data}`);
        resolve();
      });
    });
  });

  console.log('\nDone!');
}

runTests().catch(console.error);
