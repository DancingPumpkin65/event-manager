import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { config } from './config';
import { errorHandler } from './middleware/error.middleware';
import prisma from './config/database';
import authRoutes from './modules/auth/auth.routes';
import eventsRoutes from './modules/events/events.routes';
import participantsRoutes from './modules/participants/participants.routes';
import sallesRoutes from './modules/salles/salles.routes';
import coursesRoutes from './modules/courses/courses.routes';
import attendanceRoutes from './modules/attendance/attendance.routes';
import badgesRoutes from './modules/badges/badges.routes';
import adminRoutes from './modules/admin/admin.routes';
import staffRoutes from './modules/staff/staff.routes';
import eventStatsRoutes from './modules/event-stats/event-stats.routes';
const app: Express = express();

// Middleware
app.use(cors({
  origin: config.corsOrigins,
  credentials: true,
}));
app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static files from uploads directory
app.use('/uploads', express.static(path.join(process.cwd(), 'uploads')));

// Health check endpoint
app.get('/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: config.nodeEnv,
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/events', eventsRoutes);
app.use('/api/participants', participantsRoutes);
app.use('/api/salles', sallesRoutes);
app.use('/api/courses', coursesRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/badges', badgesRoutes);
app.use('/api/staff', staffRoutes);
app.use('/api/event-stats', eventStatsRoutes);

// API routes will be added here
app.get('/api', (_req: Request, res: Response) => {
  res.json({
    message: 'Event Management API',
    version: '1.0.0',
    endpoints: {
      health: '/health',
      admin: '/api/admin',
      auth: '/api/auth',
      events: '/api/events',
      participants: '/api/participants',
      courses: '/api/courses',
      badges: '/api/badges',
      salles: '/api/salles',
      attendance: '/api/attendance',
    },
  });
});

// Error handling middleware (must be last)
app.use(errorHandler);

// Start server
const PORT = config.port;

let server: any;

const startServer = async () => {
  try {
    // Test database connection
    await prisma.$connect();
    console.log('✅ Database connected successfully');

    server = app.listen(PORT, () => {
      console.log(`🚀 Server running on http://localhost:${PORT}`);
      console.log(`📊 Environment: ${config.nodeEnv}`);
      console.log(`🔗 API Docs: http://localhost:${PORT}/api`);
    });

    server.on('error', (error: any) => {
      console.error('❌ Server error:', error);
      process.exit(1);
    });

    // Keep process alive
    return new Promise(() => { });
  } catch (error) {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle shutdown gracefully
process.on('SIGINT', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  if (server) {
    server.close();
  }
  await prisma.$disconnect();
  process.exit(0);
});

process.on('SIGTERM', async () => {
  console.log('\n🛑 Shutting down gracefully...');
  if (server) {
    server.close();
  }
  await prisma.$disconnect();
  process.exit(0);
});

startServer();

export default app;
