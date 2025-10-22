import express, { Application } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import { authRouter } from './routes/auth.routes';
import { timetableRouter } from './routes/timetable.routes';
import { env } from './config/env';
import { studentRouter } from './routes/student.routes';
import { attendanceRouter } from './routes/attendance.routes';

export function createApp(): Application {
  const app = express();

  app.use(helmet());
  app.use(cors({
    origin: '*', // Allow all origins
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: false, // Set to false when using origin: '*'
  }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true, limit: '10mb' }));
  app.use(morgan('dev'));

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok' });
  });

  app.use('/api/auth', authRouter);
  app.use('/api/timetable', timetableRouter);
  app.use('/api/students', studentRouter);
  app.use('/api/attendance', attendanceRouter);

  // 404 handler
  app.use((_req, res) => {
    res.status(404).json({ message: 'Not Found' });
  });

  return app;
}


