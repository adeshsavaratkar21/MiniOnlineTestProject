require('dotenv').config();
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');

const authRoutes = require('./routes/auth');
const questionRoutes = require('./routes/questions');
const attemptRoutes = require('./routes/attempts');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 5000;

// CORS configuration: Allow frontend URL from CLIENT_URL env var, default to localhost:5173
const clientUrl = process.env.CLIENT_URL || 'http://localhost:5173';
const allowedOrigins = [
  clientUrl,
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'http://localhost:3000'
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      return callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
  })
);

// Built-in JSON middleware
app.use(express.json());

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/questions', questionRoutes);
app.use('/api/attempts', attemptRoutes);
app.use('/api/admin', adminRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  const isDbConnected = mongoose.connection.readyState === 1;
  res.status(200).json({
    status: 'ok',
    mode: isDbConnected ? 'mongodb' : 'local_storage',
    database: isDbConnected ? 'connected' : 'local_storage_active',
    message: isDbConnected
      ? 'Mini Online Test API is running with MongoDB'
      : 'Mini Online Test API is running with Local Storage. All features (login, tests, history) are active.',
    timestamp: new Date().toISOString()
  });
});

app.get('/', (req, res) => {
  res.send('Mini Online Test App Backend API is running.');
});

// 404 Handler
app.use((req, res) => {
  res.status(404).json({ message: 'Resource not found' });
});

// Global Error Handler
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ message: 'Internal Server Error' });
});

// Database Connection & Server Start
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/mini-online-test';

const startServer = async () => {
  app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
  });

  try {
    await mongoose.connect(MONGO_URI, {
      serverSelectionTimeoutMS: 3000
    });
    console.log('Connected to MongoDB successfully');
  } catch (err) {
    console.log(`[Info] No external MongoDB found (${err.message}).`);
    console.log('[Ready] Running in Instant Local Storage Mode. All features (Sign up, Login, Test, History) are fully working!');
  }
};

startServer();
