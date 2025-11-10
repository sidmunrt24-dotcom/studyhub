const express = require('express');
const Doubt = require('../models/Doubt');
const { body, validationResult } = require('express-validator');
const router = express.Router();

const DUMMY_AUTHOR = '507f1f77bcf86cd799439011';

router.get('/', async (req, res) => {
  try {
    const doubts = await Doubt.find().sort({ createdAt: -1 });
    res.json({
      success: true,
      doubts
    });
  } catch (error) {
    console.error('Get doubts error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

router.post('/', [
  body('question').notEmpty().withMessage('Question is required'),
  body('description').optional().trim()
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const { question, description, tags } = req.body;

    const doubt = new Doubt({
      question,
      description,
      tags: tags || [],
      author: DUMMY_AUTHOR
    });

    await doubt.save();

    res.status(201).json({
      success: true,
      message: 'Doubt posted successfully',
      doubt
    });
  } catch (error) {
    console.error('Create doubt error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

router.post('/:id/answers', [
  body('text').notEmpty().withMessage('Answer text is required')
], async (req, res) => {
  try {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    const doubt = await Doubt.findById(req.params.id);
    if (!doubt) {
      return res.status(404).json({
        success: false,
        message: 'Doubt not found'
      });
    }

    const answer = {
      text: req.body.text,
      author: DUMMY_AUTHOR
    };

    doubt.answers.push(answer);
    await doubt.save();

    res.json({
      success: true,
      message: 'Answer added successfully',
      doubt
    });
  } catch (error) {
    console.error('Add answer error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

module.exports = router;