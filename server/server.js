// D:\Downloads\project-bolt-sb1-wdevq44d\project\server\server.js
// import dotenv from 'dotenv';
// dotenv.config();
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
// Get current directory for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env file

config({ path: path.join(__dirname, '..', '.env') });
// dotenv.config({ path: path.join(__dirname, '..', '.env') });
// dotenv.config();
console.log('JWT_SECRET directly after config:', process.env.JWT_SECRET);
// console.log('Loaded ENV:', process.env); // Check if your vars are loaded
console.log('Env file path:', path.join(__dirname, '..', '.env')); // Verify the path

import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';

import helmet from 'helmet';
import cron from 'node-cron';



// Import routes
import authRoutes from './routes/auth.js';
import fileRoutes from './routes/files.js';
import linkRoutes from './routes/links.js';
import userRoutes from './routes/users.js';

// Import middleware
import { errorHandler } from './middleware/errorHandler.js';
import { rateLimiter } from './middleware/rateLimiter.js';

// Import utilities
import { cleanupExpiredLinks } from './utils/cleanup.js';


const app = express();
const PORT = process.env.PORT || 5000;

// Security middleware
app.use(helmet());
app.use(rateLimiter);

// CORS configuration
// app.use(cors({
//   origin: process.env.CLIENT_URL || 'http://localhost:5173',
//   credentials: true,
//   allowedHeaders: ['Content-Type', 'Authorization']
// }));

// Replace current CORS setup with:
const corsOptions = {
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
    allowedHeaders: [
    'Content-Type',
    'Authorization',
    'X-Requested-With',
    'X-Client-Version', // Add this line
    'X-CSRF-TOKEN',    // Add this if using CSRF
    'X-Request-ID'     // Add this if using request tracking
  ],
  exposedHeaders: [
    'Content-Disposition' // For file downloads
  ],

  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS','PATCH'],
  optionsSuccessStatus: 200 // For legacy browser support
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions)); // Preflight handling

// Body parsing middleware
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/guardshare')
  .then(() => {
    console.log('✅ Connected to MongoDB');
  })
  .catch((error) => {
    console.error('❌ MongoDB connection error:', error);
    process.exit(1);
  });

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/files', fileRoutes);
app.use('/api/links', linkRoutes);
app.use('/api/users', userRoutes);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV 
  });
});

// Error handling middleware
app.use(errorHandler);

// Cron jobs
// Clean up expired links every hour
cron.schedule('0 * * * *', () => {
  console.log('🧹 Running cleanup for expired links...');
  cleanupExpiredLinks();
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 GuardShare server running on port ${PORT}`);
  console.log(`📊 Environment: ${process.env.NODE_ENV}`);
});

export default app;