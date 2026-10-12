import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createBullBoard } from '@bull-board/api';
import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { ExpressAdapter } from '@bull-board/express';
import './config/firebase.js'; // Initializes Firebase Admin SDK
import './workers/email.worker.js'; // Initializes BullMQ Email Queue Worker
import { emailQueue } from './queues/email.queue.js';
import { verifyToken } from './middleware/auth.middleware.js';

// Import Route Modules
import authRoutes from './routes/auth.routes.js';
import publicRoutes from './routes/public.routes.js';
import eventsRoutes from './routes/events.routes.js';
import usersRoutes from './routes/users.routes.js';
import registrationsRoutes from './routes/registrations.routes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map(o => o.trim())
  : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:3001', 'http://localhost:5174'];

app.disable('etag');
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes('*') || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(null, true);
    }
  },
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With']
}));
app.use(express.json({ limit: '10mb' }));
app.use('/uploads', express.static('uploads'));
app.use((req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
  res.setHeader('Pragma', 'no-cache');
  res.setHeader('Expires', '0');
  next();
});

// Setup Bull-Board UI Dashboard
const serverAdapter = new ExpressAdapter();
serverAdapter.setBasePath('/admin/queues');

createBullBoard({
  queues: [new BullMQAdapter(emailQueue)],
  serverAdapter: serverAdapter
});

app.use('/admin/queues', serverAdapter.getRouter());

// Apply JWT Verification Middleware globally for private /api/* routes
app.use(verifyToken);

// Mount Modular API Routers
app.use('/api/auth', authRoutes);
app.use('/api/public', publicRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/registrations', registrationsRoutes);
// Legacy alias for /api/send-email endpoint
app.use('/api', registrationsRoutes);

// Start Express Server Listener
app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`🚀 EMS Express Backend Server Live at http://localhost:${PORT}`);
  console.log(`=================================================`);
});
