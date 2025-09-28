const mongoose = require('mongoose');

const userSchema = new mongoose.Schema({
  clerkId: {
    type: String,
    required: true,
    unique: true
  },
  email: {
    type: String,
    required: true
  },
  twitterId: String,
  twitterUsername: String,
  twitterAccessToken: String,
  twitterRefreshToken: String,
  isTwitterConnected: {
    type: Boolean,
    default: false
  },
  // Temporary OAuth data for session reliability
  tempCodeVerifier: String,
  tempState: String,
  tempStateExpiry: Date
}, {
  timestamps: true
});

module.exports = mongoose.model('User', userSchema);