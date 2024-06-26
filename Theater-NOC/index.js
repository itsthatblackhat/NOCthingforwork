const express = require('express');
const path = require('path');
const fs = require('fs');
const crypto = require('crypto');
const http = require('http');
const app = express();
const PORT = 3000;

// Key for encryption and decryption (must be 32 bytes for AES-256)
const encryptionKey = crypto.createHash('sha256').update('dogecoin').digest('base64').substr(0, 32);
const algorithm = 'aes-256-ctr';

// Middleware to parse JSON bodies
app.use(express.json());

// Serve the static HTML and JS files
app.use(express.static(path.join(__dirname, 'public')));

// Function to encrypt text
const encrypt = (text) => {
    const iv = crypto.randomBytes(16);
    const cipher = crypto.createCipheriv(algorithm, Buffer.from(encryptionKey), iv);
    let encrypted = cipher.update(text);
    encrypted = Buffer.concat([encrypted, cipher.final()]);
    return iv.toString('hex') + ':' + encrypted.toString('hex');
}

// Function to decrypt text
const decrypt = (text) => {
    const textParts = text.split(':');
    const iv = Buffer.from(textParts.shift(), 'hex');
    const encryptedText = Buffer.from(textParts.join(':'), 'hex');
    const decipher = crypto.createDecipheriv(algorithm, Buffer.from(encryptionKey), iv);
    let decrypted = decipher.update(encryptedText);
    decrypted = Buffer.concat([decrypted, decipher.final()]);
    return decrypted.toString();
}

// Read and decrypt the devices file
const readDevices = () => {
    try {
        const data = fs.readFileSync('devices.dat', 'utf8');
        const decryptedData = decrypt(data);
        return JSON.parse(decryptedData);
    } catch (err) {
        return [];
    }
}

// Encrypt and write to the devices file
const writeDevices = (devices) => {
    const encryptedData = encrypt(JSON.stringify(devices));
    fs.writeFileSync('devices.dat', encryptedData);
}

// Function to check if the device is reachable
const checkDeviceStatus = (ip, port) => {
    return new Promise((resolve) => {
        const options = {
            method: 'HEAD',
            host: ip,
            port: port,
            path: '/',
            timeout: 10000 // 10 seconds timeout
        };

        const req = http.request(options, (res) => {
            resolve('green');
        });

        req.on('error', (err) => {
            resolve('red');
        });

        req.on('timeout', () => {
            req.destroy();
            resolve('red');
        });

        req.end();
    });
}

// Endpoint to get device status
app.get('/api/device-status/:device', async (req, res) => {
    const device = req.params.device;
    const devices = readDevices();
    const deviceInfo = devices.find(d => d.alias === device);
    if (deviceInfo) {
        const statusColor = await checkDeviceStatus(deviceInfo.ip, deviceInfo.port);
        res.json({ status: statusColor === 'green' ? 'OK' : 'Unavailable', color: statusColor });
    } else {
        res.status(404).json({ error: 'Device not found' });
    }
});

// Endpoint to get device notifications
app.get('/api/device-notifications/:device', (req, res) => {
    const device = req.params.device;
    const notifications = []; // Implement logic to fetch notifications
    res.json(notifications);
});

// Endpoint to get the list of devices
app.get('/api/get-devices', (req, res) => {
    const devices = readDevices();
    res.json(devices);
});

// Endpoint to add a new device
app.post('/api/add-device', (req, res) => {
    const { alias, ip, port, username, password } = req.body;
    const devices = readDevices();
    devices.push({ alias, ip, port, username, password });
    writeDevices(devices);
    res.json({ message: 'Device added successfully' });
});

// Endpoint to edit a device
app.post('/api/edit-device', (req, res) => {
    const { originalAlias, alias, ip, port, username, password } = req.body;
    const devices = readDevices();
    const deviceIndex = devices.findIndex(d => d.alias === originalAlias);
    if (deviceIndex !== -1) {
        devices[deviceIndex] = { alias, ip, port, username, password };
        writeDevices(devices);
        res.json({ message: 'Device edited successfully' });
    } else {
        res.status(404).json({ error: 'Device not found' });
    }
});

// Endpoint to delete a device
app.post('/api/delete-device', (req, res) => {
    const { alias } = req.body;
    const devices = readDevices();
    const newDevices = devices.filter(d => d.alias !== alias);
    writeDevices(newDevices);
    res.json({ message: 'Device deleted successfully' });
});

// Endpoint to get device details for editing
app.get('/api/device-details/:device', (req, res) => {
    const device = req.params.device;
    const devices = readDevices();
    const deviceInfo = devices.find(d => d.alias === device);
    if (deviceInfo) {
        res.json(deviceInfo);
    } else {
        res.status(404).json({ error: 'Device not found' });
    }
});

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
