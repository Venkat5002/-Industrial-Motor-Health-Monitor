const mongoose = require('mongoose');

const modelSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  version: { type: String, default: '1.0' },
  thresholds: {
    vibrationRMS: { type: Number, default: 3.0 },
    temperature: { type: Number, default: 70 },
    current: { type: Number, default: 5.0 },
  },
}, { timestamps: true });

module.exports = mongoose.model('Model', modelSchema);
