import { Router } from 'express';
import { 
  startAttendanceSession, 
  markAttendance, 
  getAttendanceSession, 
  getAttendanceReports,
  checkAttendanceStatus,
  getStudentAttendanceData
} from '../controllers/attendance.controller';
import { verifyFacultyToken } from '../middleware/auth';

export const attendanceRouter = Router();

// Start new attendance session
attendanceRouter.post('/start', verifyFacultyToken, startAttendanceSession);

// Mark attendance using face detection
attendanceRouter.post('/mark', verifyFacultyToken, markAttendance);

// Get attendance session details
attendanceRouter.get('/session/:sessionId', verifyFacultyToken, getAttendanceSession);

// Get attendance reports
attendanceRouter.get('/reports', verifyFacultyToken, getAttendanceReports);

// Check if attendance has been taken for today's session
attendanceRouter.get('/status', verifyFacultyToken, checkAttendanceStatus);

// Get student attendance data for a specific subject/section/sessionType
attendanceRouter.get('/student-data', verifyFacultyToken, getStudentAttendanceData);
