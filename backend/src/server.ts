import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import mongoose from 'mongoose';
import path from 'path';
import http from 'http';
import { Server as SocketIO } from 'socket.io';
import config from './config/env';
import routes from './routes';
import initSocketServer from './websocket';

// Initialize express app
const app = express();
const server = http.createServer(app);
export const io = new SocketIO(server, {
  cors: {
    origin: config.corsOrigin,
    methods: ['GET', 'POST'],
    credentials: true
  }
});

// Apply middlewares
// Configure Helmet with CSP settings that allow CDN resources for the test page
app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        scriptSrc: ["'self'", "'unsafe-inline'", "cdn.socket.io", "cdn.ethers.io", "unpkg.com"],
        scriptSrcAttr: ["'unsafe-inline'"],
        connectSrc: ["'self'", "ws:", "wss:"],
        imgSrc: ["'self'", "data:"],
        styleSrc: ["'self'", "'unsafe-inline'"]
      }
    }
  })
);
app.use(cors({
  origin: config.corsOrigin,
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'wallet-address']
}));
app.use(express.json());

// Serve static files from the generated folder
app.use('/static', express.static(path.join(__dirname, '../generated')));

// Serve public files (for testing interface)
app.use(express.static(path.join(__dirname, 'public')));

// Add a route to serve the test interface
app.get('/test', (req, res) => {
  res.sendFile(path.join(__dirname, 'public/test.html'));
});

// Set up routes
app.use('/api', routes);

// Initialize WebSocket server
initSocketServer(io);

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error(err.stack);
  res.status(500).json({
    success: false,
    message: 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.message : undefined,
  });
});

// Connect to MongoDB
const connectDB = async (): Promise<void> => {
  try {
    if (!config.mongoUri) {
      throw new Error('MongoDB URI is not defined in environment variables');
    }
    
    await mongoose.connect(config.mongoUri);
    console.log('Connected to MongoDB');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1); // Exit with failure
  }
};

// Start the server
const startServer = async (): Promise<void> => {
  await connectDB();

  server.listen(config.port, () => {
    console.log(`Server running on port ${config.port} in ${config.nodeEnv} mode`);
    console.log(`MongoDB connected: ${config.mongoUri}`);
    console.log(`WebSocket server initialized`);
    console.log(`Test interface available at http://api.offchainbrazil.org/test`);
  });
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (err: Error) => {
  console.error('Unhandled Promise Rejection:', err);
  // Close server & exit process
  process.exit(1);
});

startServer().catch(err => {
  console.error('Server startup error:', err);
  process.exit(1);
});

export default app; 