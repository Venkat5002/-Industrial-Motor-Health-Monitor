const mongoose = require('mongoose');

const deviceSchema = new mongoose.Schema({
  name: { type: String, required: true },
  location: { type: String, required: true },
  status: { type: String, enum: ['active', 'inactive', 'maintenance'], default: 'active' },
  lastVibration: { type: Number },
  lastTemperature: { type: Number },
  lastCurrent: { type: Number },
  lastRiskScore: { type: Number },
}, { timestamps: true });

module.exports = mongoose.model('Device', deviceSchema);
