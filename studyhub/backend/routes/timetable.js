const express = require('express');
const Timetable = require('../models/Timetable');
const { auth } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    let timetable = await Timetable.findOne({ author: req.user.id });
    
    if (!timetable) {
      timetable = new Timetable({
        author: req.user.id,
        schedule: []
      });
      await timetable.save();
    }

    res.json({
      success: true,
      timetable
    });
  } catch (error) {
    console.error('Get timetable error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

router.post('/', [auth, [
  body('schedule').isArray().withMessage('Schedule must be an array')
]], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { schedule } = req.body;

    let timetable = await Timetable.findOne({ author: req.user.id });

    if (timetable) {
      // Update existing timetable
      timetable.schedule = schedule;
    } else {
      // Create new timetable
      timetable = new Timetable({
        schedule,
        author: req.user.id
      });
    }

    await timetable.save();

    res.json({
      success: true,
      message: 'Timetable saved successfully',
      timetable
    });
  } catch (error) {
    console.error('Save timetable error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;