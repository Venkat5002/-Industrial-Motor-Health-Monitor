const mongoose = require('mongoose');

const incidentSchema = new mongoose.Schema({
  deviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Device', required: true },
  timestamp: { type: Date, default: Date.now },
  type: { type: String, enum: ['vibration', 'temperature', 'current', 'other'], required: true },
  description: { type: String },
  severity: { type: String, enum: ['low', 'medium', 'high'], default: 'medium' },
}, { timestamps: true });

module.exports = mongoose.model('Incident', incidentSchema);
