// Dependency Imports
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const { body, validationResult } = require('express-validator');
require('dotenv').config();

// Validate required environment variables early
if (!process.env.MONGODB_URI) {
  console.error('Missing required environment variable: MONGODB_URI');
  console.error('');
  console.error('Quick Setup:');
  console.error('  1. Navigate to backend directory: cd backend');
  console.error('  2. Copy example file: cp .env.example .env (or "copy" on Windows)');
  console.error('  3. Edit .env and set MONGODB_URI to your MongoDB Atlas connection string');
  console.error('  4. Restart the server');
  console.error('');
  console.error('See README.md for detailed instructions.');
  process.exit(1);
}

// Validate ALLOWED_ORIGINS in production
if (process.env.NODE_ENV === 'production' && !process.env.ALLOWED_ORIGINS) {
  console.error('ALLOWED_ORIGINS must be set in production for CORS configuration.');
  console.error('Set ALLOWED_ORIGINS in backend/.env with your production frontend URLs.');
  console.error('Example: ALLOWED_ORIGINS=https://yourdomain.com,https://www.yourdomain.com');
  process.exit(1);
}

// Express App Initialization
const app = express();

// Middleware Configuration
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// CORS Configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS ? process.env.ALLOWED_ORIGINS.split(',') : ['http://localhost:3000', 'http://127.0.0.1:3000'];
console.log('Allowed origins for CORS:', allowedOrigins);

function isOriginAllowed(origin, allowedOrigins) {
  for (let allowed of allowedOrigins) {
    allowed = allowed.trim();
    if (allowed === origin) return true;
    if (allowed.startsWith('*.')) {
      const domain = allowed.slice(2);
      if (origin === domain || origin.endsWith('.' + domain)) return true;
    }
  }
  return false;
}

const corsOptions = {
  origin: function (origin, callback) {
    if (!origin || isOriginAllowed(origin, allowedOrigins)) {
      callback(null, true);
    } else {
      console.error(`CORS blocked origin: ${origin}. Allowed origins: ${allowedOrigins.join(', ')}`);
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  maxAge: 86400, // 24 hours preflight cache
};
app.use(cors(corsOptions));

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to MongoDB');

    const port = process.env.PORT || 5000;

    const server = app.listen(port, () => {
      const baseUrl = process.env.NODE_ENV === 'production' 
        ? 'https://studyhub-yaib.onrender.com' 
        : `http://localhost:${port}`;
      
      console.log(`\n✅ Using configured port ${port}`);
      console.log(`🚀 StudyHub Backend Server Started!`);
      console.log(`📍 Port: ${port}`);
      console.log(`🌐 API: ${baseUrl}/api`);
      console.log(`❤️  Health: ${baseUrl}/api/health`);
      console.log(`⏰ Started at: ${new Date().toLocaleString()}`);
    });

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE') {
        console.error(`Port ${port} is already in use.`);
        console.error('To resolve this:');
        console.error('- On Windows: Run `netstat -ano | findstr :${port}` to find PID, then `taskkill /PID <PID> /F`');
        console.error('- On Unix/Mac: Run `lsof -ti:${port} | xargs kill -9`');
        console.error('- Alternatively, set PORT in backend/.env to a different value.');
        process.exit(1);
      } else {
        console.error('Server error:', err);
        process.exit(1);
      }
    });
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err);
    process.exit(1);
  });

// Connection event listeners
mongoose.connection.on('connected', () => {
  console.log('Mongoose connected to MongoDB');
});

mongoose.connection.on('error', (err) => {
  console.error('Mongoose connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('Mongoose disconnected');
});

// Graceful shutdown handlers
const shutdown = async () => {
  console.log('Shutting down gracefully...');
  await mongoose.connection.close();
  process.exit(0);
};

process.on('SIGTERM', shutdown);
process.on('SIGINT', shutdown);

// Model Imports
const Note = require('./models/Note');
const Doubt = require('./models/Doubt');
const Timetable = require('./models/Timetable');

// Health Check Endpoint
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    message: 'Server is running'
  });
});

// Notes Routes
app.get('/api/notes', async (req, res) => {
  try {
    const notes = await Note.find().sort({ updatedAt: -1 });
    res.json({
      success: true,
      notes
    });
  } catch (error) {
    console.error('Get notes error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

app.post('/api/notes', 
  [
    body('title').trim().notEmpty().withMessage('Title is required'),
    body('content').isString().isLength({ max: 100000 }).withMessage('Content must be a string with max length 100000'),
    body('tags').optional().isArray().withMessage('Tags must be an array'),
    body('tags.*').optional().isString().withMessage('Each tag must be a string')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    try {
      const { title, content, tags } = req.body;

      if (Buffer.byteLength(content, 'utf8') > 100000) {
        return res.status(413).json({
          success: false,
          message: 'Content too large. Maximum size is 100KB'
        });
      }

      const note = new Note({
        title,
        content,
        tags: tags || [],
        author: 'Anonymous'
      });

      await note.save();

      res.status(201).json({
        success: true,
        message: 'Note created successfully',
        note
      });
    } catch (error) {
      console.error('Create note error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
});

app.put('/api/notes/:id',
  [
    body('title').optional().trim().notEmpty().withMessage('Title cannot be empty'),
    body('content').optional().isString().isLength({ max: 100000 }).withMessage('Content must be a string with max length 100000'),
    body('tags').optional().isArray().withMessage('Tags must be an array'),
    body('tags.*').optional().isString().withMessage('Each tag must be a string')
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      return res.status(400).json({
        success: false,
        message: 'Validation failed',
        errors: errors.array()
      });
    }

    try {
      const { title, content, tags } = req.body;

      const note = await Note.findById(req.params.id);
      if (!note) {
        return res.status(404).json({
          success: false,
          message: 'Note not found'
        });
      }

      if (content && Buffer.byteLength(content, 'utf8') > 100000) {
        return res.status(413).json({
          success: false,
          message: 'Content too large. Maximum size is 100KB'
        });
      }

      if (title) note.title = title;
      if (content) note.content = content;
      if (tags) note.tags = tags;

      await note.save();

      res.json({
        success: true,
        message: 'Note updated successfully',
        note
      });
    } catch (error) {
      console.error('Update note error:', error);
      res.status(500).json({
        success: false,
        message: 'Server error'
      });
    }
});

app.delete('/api/notes/:id', async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found'
      });
    }

    await Note.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Note deleted successfully'
    });
  } catch (error) {
    console.error('Delete note error:', error);
    res.status(500).json({
      success: false,
      message: 'Server error'
    });
  }
});

// Doubts Routes
app.get('/api/doubts', async (req, res) => {
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

app.post('/api/doubts', async (req, res) => {
  try {
    const { question, description, tags } = req.body;

    const doubt = new Doubt({
      question,
      description,
      tags: tags || [],
      author: 'Anonymous'
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

app.post('/api/doubts/:id/answers', async (req, res) => {
  try {
    const { text } = req.body;

    const doubt = await Doubt.findById(req.params.id);
    if (!doubt) {
      return res.status(404).json({
        success: false,
        message: 'Doubt not found'
      });
    }

    const answer = {
      text,
      author: 'Anonymous'
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

// User-level resolve route: only the author may set resolved state
app.put('/api/doubts/:id/resolve', async (req, res) => {
  try {
    const doubt = await Doubt.findById(req.params.id);
    if (!doubt) {
      return res.status(404).json({ success: false, message: 'Doubt not found' });
    }

    // Allow only if author
    const requesterId = String(DUMMY_USER._id);
    const authorId = String(doubt.author);

    if (requesterId !== authorId) {
      return res.status(403).json({ success: false, message: 'Not authorized to resolve this doubt' });
    }

    // Idempotent: accept explicit isResolved value from request body
    const { isResolved } = req.body;
    if (typeof isResolved !== 'boolean') {
      return res.status(400).json({ success: false, message: 'isResolved must be a boolean' });
    }

    doubt.isResolved = isResolved;
    await doubt.save();
    await doubt.populate('author', 'name avatar');

    res.json({ success: true, message: `Doubt ${doubt.isResolved ? 'resolved' : 'unresolved'}`, doubt });
  } catch (error) {
    console.error('Resolve doubt (user) error:', error);
    res.status(500).json({ success: false, message: 'Server error' });
  }
});

// Timetable Routes
app.get('/api/timetable', async (req, res) => {
  try {
    let timetable = await Timetable.findOne({ author: 'Anonymous' });
    
    if (!timetable) {
      timetable = new Timetable({
        author: 'Anonymous',
        schedule: [
          { day: 'Monday', slots: [] },
          { day: 'Tuesday', slots: [] },
          { day: 'Wednesday', slots: [] },
          { day: 'Thursday', slots: [] },
          { day: 'Friday', slots: [] },
          { day: 'Saturday', slots: [] },
          { day: 'Sunday', slots: [] }
        ]
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

app.post('/api/timetable', async (req, res) => {
  try {
    const { schedule } = req.body;

    let timetable = await Timetable.findOne({ author: 'Anonymous' });

    if (timetable) {
      timetable.schedule = schedule;
    } else {
      timetable = new Timetable({
        schedule,
        author: 'Anonymous'
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

// Handle 404
app.use('*', (req, res) => {
  res.status(404).json({
    success: false,
    message: 'API endpoint not found'
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({ 
    success: false,
    message: 'Something went wrong!'
  });
});
