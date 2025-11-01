const mongoose = require('mongoose');

const timetableSchema = new mongoose.Schema({
  schedule: [{
    day: {
      type: String,
      enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
      required: true
    },
    slots: [{
      time: {
        type: String,
        required: true
      },
      subject: {
        type: String,
        required: true
      },
      topic: {
        type: String
      },
      isCompleted: {
        type: Boolean,
        default: false
      }
    }]
  }],
  author: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Timetable', timetableSchema);