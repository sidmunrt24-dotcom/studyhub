const express = require('express');
const Doubt = require('../models/Doubt');
const { auth } = require('../middleware/auth');
const { body, validationResult } = require('express-validator');
const router = express.Router();

router.get('/', auth, async (req, res) => {
  try {
    const doubts = await Doubt.find()
      .populate('author', 'name avatar')
      .populate('answers.author', 'name avatar')
      .sort({ createdAt: -1 });
    
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

router.post('/', [auth, [
  body('question').notEmpty().withMessage('Question is required'),
  body('description').optional().trim()
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

    const { question, description, tags } = req.body;

    const doubt = new Doubt({
      question,
      description,
      tags: tags || [],
      author: req.user.id
    });

    await doubt.save();
    await doubt.populate('author', 'name avatar');

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

router.post('/:id/answers', [auth, [
  body('text').notEmpty().withMessage('Answer text is required')
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

    const doubt = await Doubt.findById(req.params.id);
    if (!doubt) {
      return res.status(404).json({
        success: false,
        message: 'Doubt not found'
      });
    }

    const answer = {
      text: req.body.text,
      author: req.user.id
    };

    doubt.answers.push(answer);
    await doubt.save();
    await doubt.populate('answers.author', 'name avatar');

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