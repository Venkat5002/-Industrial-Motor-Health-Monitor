const mongoose = require('mongoose');

const readingSchema = new mongoose.Schema({
  deviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Device', required: true },
  timestamp: { type: Date, default: Date.now },
  vibration: { type: Number, required: true },
  temperature: { type: Number, required: true },
  current: { type: Number, required: true },
  riskScore: { type: Number, required: true },
});

module.exports = mongoose.model('Reading', readingSchema);
