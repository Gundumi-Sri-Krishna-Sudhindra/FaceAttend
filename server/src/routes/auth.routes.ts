import { Router } from 'express';
import { login, register, getProfile, updateProfile, changePassword } from '../controllers/auth.controller';
import { verifyFacultyToken } from '../middleware/auth';

export const authRouter = Router();

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.get('/profile', verifyFacultyToken, getProfile);
authRouter.put('/profile', verifyFacultyToken, updateProfile);
authRouter.post('/change-password', verifyFacultyToken, changePassword);


