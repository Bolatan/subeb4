const mongoose = require('mongoose');

const loginLogSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    trim: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
  status: {
    type: String,
    enum: ['success', 'failure'],
    required: true,
  },
});

const LoginLog = mongoose.model('LoginLog', loginLogSchema);

module.exports = LoginLog;
