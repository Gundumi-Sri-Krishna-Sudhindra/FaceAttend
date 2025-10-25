import { Router } from 'express';
import { registerStudent, getStudents, updateStudent, deleteStudent } from '../controllers/student.controller';
import { verifyFacultyToken } from '../middleware/auth';

export const studentRouter = Router();

studentRouter.post('/register', verifyFacultyToken, registerStudent);
studentRouter.get('/', verifyFacultyToken, getStudents);
studentRouter.put('/:studentId', verifyFacultyToken, updateStudent);
studentRouter.delete('/:studentId', verifyFacultyToken, deleteStudent);


