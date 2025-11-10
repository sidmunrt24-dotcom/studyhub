const mongoose = require('mongoose');

const doubtSchema = new mongoose.Schema({
  question: {
    type: String,
    required: [true, 'Question is required'],
    trim: true
  },
  description: {
    type: String,
    trim: true
  },
  author: {
    type: String,
    default: 'Anonymous'
  },
  tags: [{
    type: String,
    trim: true
  }],
  answers: [{
    text: {
      type: String,
      required: true
    },
    author: {
      type: String,
      default: 'Anonymous'
    },
    createdAt: {
      type: Date,
      default: Date.now
    }
  }],
  isResolved: {
    type: Boolean,
    default: false
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Doubt', doubtSchema);