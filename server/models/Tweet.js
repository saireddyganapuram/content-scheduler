const mongoose = require('mongoose');

const tweetSchema = new mongoose.Schema({
  userId: {
    type: String,
    required: true
  },
  content: {
    type: String,
    required: true,
    maxlength: 280
  },
  scheduledTime: {
    type: Date,
    required: true
  },
  status: {
    type: String,
    enum: ['scheduled', 'posted', 'failed'],
    default: 'scheduled'
  },
  twitterId: String,
  errorMessage: String
}, {
  timestamps: true
});

module.exports = mongoose.model('Tweet', tweetSchema);