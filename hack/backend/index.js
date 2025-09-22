const express = require('express');
const mongoose = require('mongoose');
const Reading = require('./models/Reading');
const Device = require('./models/Device');
const User = require('./models/User'); // Import User model
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const app = express();
const PORT = process.env.PORT || 3000;
const JWT_SECRET = process.env.JWT_SECRET || 'supersecretjwtkey'; // Use environment variable for secret

// Middleware to parse JSON bodies
app.use(express.json());

// MongoDB Connection
mongoose.connect('mongodb://localhost:27017/motorhealth', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// JWT Authentication Middleware
const authenticateToken = (req, res, next) => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (token == null) return res.sendStatus(401); // No token

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.sendStatus(403); // Invalid token
    req.user = user;
    next();
  });
};

// User Registration
app.post('/api/register', async (req, res) => {
  try {
    const { username, password } = req.body;
    const hashedPassword = await bcrypt.hash(password, 10);
    const user = new User({ username, password: hashedPassword });
    await user.save();
    res.status(201).send({ message: 'User registered successfully.' });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).send({ message: 'Username already exists.' });
    }
    console.error('Error registering user:', error);
    res.status(500).send({ message: 'Error registering user.' });
  }
});

// User Login
app.post('/api/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    const user = await User.findOne({ username });
    if (!user) {
      return res.status(400).send({ message: 'Invalid credentials.' });
    }
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).send({ message: 'Invalid credentials.' });
    }
    const token = jwt.sign({ username: user.username, id: user._id }, JWT_SECRET, { expiresIn: '1h' });
    res.status(200).send({ token, message: 'Logged in successfully.' });
  } catch (error) {
    console.error('Error logging in:', error);
    res.status(500).send({ message: 'Error logging in.' });
  }
});

// Basic route (protected)
// app.get('/', authenticateToken, (req, res) => {
//   res.send('Motor Health API is running and authenticated.');
// });
app.get('/', (req, res) => {
  res.send('Motor Health API is running.');
});

// Apply authenticateToken middleware to all routes that need protection
// app.use('/api/devices', authenticateToken);
// app.use('/api/readings', authenticateToken);

// Create Device (for testing)
app.post('/api/devices', async (req, res) => {
  try {
    const device = new Device(req.body);
    await device.save();
    res.status(201).send(device);
  } catch (error) {
    res.status(400).send(error);
  }
});

// Ingest a new reading
app.post('/api/readings', async (req, res) => {
  try {
    const { deviceId, vibration, temperature, current, riskScore } = req.body; // Updated field names

    // Find and update the device, or create if it doesn't exist
    let device = await Device.findById(deviceId);
    if (!device) {
      device = new Device({ _id: deviceId, name: `Device ${deviceId}`, location: 'Unknown' });
    }

    device.lastVibration = vibration;
    device.lastTemperature = temperature;
    device.lastCurrent = current;
    device.lastRiskScore = riskScore; // Store risk score
    await device.save();

    const reading = new Reading({ deviceId, vibration, temperature, current, riskScore });
    await reading.save();

    res.status(201).send(reading);
  } catch (error) {
    console.error('Error ingesting reading:', error);
    res.status(400).send(error);
  }
});

// List all readings (might be too much data in production, consider pagination)
app.get('/api/readings', async (req, res) => {
  try {
    const readings = await Reading.find(); // Removed populate, as we want raw readings for now
    res.status(200).send(readings);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Fetch latest reading for a device (no longer needed as device stores last values)
app.get('/api/readings/latest/:deviceId', async (req, res) => {
  try {
    const { deviceId } = req.params;
    const latestReading = await Reading.findOne({ deviceId }).sort({ timestamp: -1 });
    if (!latestReading) {
      return res.status(404).send({ message: 'No readings found for this device.' });
    }
    res.status(200).send(latestReading);
  } catch (error) {
    res.status(500).send(error);
  }
});

// List all devices (now includes latest sensor data)
app.get('/api/devices', async (req, res) => {
  try {
    const devices = await Device.find();
    res.status(200).send(devices);
  } catch (error) {
    res.status(500).send(error);
  }
});

// Fetch historical readings for a specific device
app.get('/api/devices/:id/readings', async (req, res) => {
  try {
    const { id } = req.params;
    const readings = await Reading.find({ deviceId: id }).sort({ timestamp: 1 });
    res.status(200).send(readings);
  } catch (error) {
    console.error(`Error fetching readings for device ${id}:`, error);
    res.status(500).send(error);
  }
});

// Seed data endpoint (for testing and quick setup)
app.get('/api/seed-data', async (req, res) => {
  try {
    await Device.deleteMany({});
    await Reading.deleteMany({});

    const devicesToCreate = [
      { name: 'Motor A', location: 'Factory Floor', status: 'active' },
      { name: 'Motor B', location: 'Assembly Line', status: 'active' },
      { name: 'Motor C', location: 'Warehouse', status: 'maintenance' },
    ];

    const createdDevices = await Device.insertMany(devicesToCreate);

    const readings = [];
    createdDevices.forEach(device => {
      for (let i = 0; i < 15; i++) { // Add 15 historical readings per device
        const timestamp = new Date(Date.now() - (15 - i) * 60 * 1000).toISOString(); // Readings over last 15 minutes
        readings.push(
          { deviceId: device._id, vibration: +(Math.random() * 2 + 0.5).toFixed(2), temperature: Math.floor(Math.random() * 30) + 40, current: +(Math.random() * 5 + 2).toFixed(2), riskScore: Math.floor(Math.random() * 100), timestamp: timestamp },
        );
      }
    });
    await Reading.insertMany(readings);

    // Update last known values for each created device
    for (const device of createdDevices) {
      const latestReading = readings
        .filter(r => r.deviceId.toString() === device._id.toString())
        .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[readings.filter(r => r.deviceId.toString() === device._id.toString()).length -1];

      await Device.findByIdAndUpdate(device._id, {
        lastVibration: latestReading ? latestReading.vibration : +(Math.random() * 2 + 0.5).toFixed(2),
        lastTemperature: latestReading ? latestReading.temperature : Math.floor(Math.random() * 30) + 40,
        lastCurrent: latestReading ? latestReading.current : +(Math.random() * 5 + 2).toFixed(2),
        lastRiskScore: latestReading ? latestReading.riskScore : Math.floor(Math.random() * 100),
      });
    }

    res.status(200).send({ message: 'Database seeded with multiple devices and readings.' });
  } catch (error) {
    console.error('Error seeding data:', error);
    res.status(500).send({ message: 'Failed to seed data.', error: error.message });
  }
});

app.put('/api/devices/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, location, status } = req.body;
    const device = await Device.findByIdAndUpdate(id, { name, location, status }, { new: true, runValidators: true });
    if (!device) {
      return res.status(404).send({ message: 'Device not found.' });
    }
    res.status(200).send(device);
  } catch (error) {
    console.error('Error updating device:', error);
    res.status(400).send(error);
  }
});

// Delete Device
app.delete('/api/devices/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const device = await Device.findByIdAndDelete(id);
    if (!device) {
      return res.status(404).send({ message: 'Device not found.' });
    }
    // Optionally, delete all readings associated with this device as well
    await Reading.deleteMany({ deviceId: id });
    res.status(200).send({ message: 'Device and associated readings deleted successfully.' });
  } catch (error) {
    console.error('Error deleting device:', error);
    res.status(500).send(error);
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
