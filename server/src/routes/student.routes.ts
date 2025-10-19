import { Router } from 'express';
import { registerStudent, getStudents, deleteStudent } from '../controllers/student.controller';
import { verifyFacultyToken } from '../middleware/auth';

export const studentRouter = Router();

studentRouter.post('/register', verifyFacultyToken, registerStudent);
studentRouter.get('/', verifyFacultyToken, getStudents);
studentRouter.delete('/:studentId', verifyFacultyToken, deleteStudent);


