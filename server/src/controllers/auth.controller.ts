import { Request, Response } from 'express';
import jwt, { SignOptions } from 'jsonwebtoken';
import { Faculty } from '../models/Faculty';
import { env } from '../config/env';

function signToken(userId: string): string {
  return jwt.sign({ sub: userId }, env.jwtSecret, { expiresIn: '7d' });
}

export async function register(req: Request, res: Response): Promise<void> {
  try {
    const { name, email, username, password } = req.body as { 
      name: string; 
      email: string; 
      username: string; 
      password: string; 
    };
    
    if (!name || !email || !username || !password) {
      res.status(400).json({ message: 'name, email, username, password are required' });
      return;
    }

    // Check if email already exists
    const existingEmail = await Faculty.findOne({ email });
    if (existingEmail) {
      res.status(409).json({ message: 'Email already registered' });
      return;
    }

    // Check if username already exists
    const existingUsername = await Faculty.findOne({ username });
    if (existingUsername) {
      res.status(409).json({ message: 'Username already taken' });
      return;
    }

    const faculty = await Faculty.create({ name, email, username, password });
    const token = signToken(faculty.id);
    res.status(201).json({
      user: { id: faculty.id, name: faculty.name, username: faculty.username },
      token,
    });
  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({ message: 'Registration failed' });
  }
}

export async function login(req: Request, res: Response): Promise<void> {
  try {
    const { username, password } = req.body as { username: string; password: string };
    if (!username || !password) {
      res.status(400).json({ message: 'username and password are required' });
      return;
    }

    const faculty = await Faculty.findOne({ username });
    if (!faculty) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const isMatch = await faculty.comparePassword(password);
    if (!isMatch) {
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const token = signToken(faculty.id);
    res.json({ user: { id: faculty.id, name: faculty.name, username: faculty.username }, token });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ message: 'Login failed' });
  }
}

export async function getProfile(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const faculty = await Faculty.findById(userId).select('name email username');
    if (!faculty) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    res.json({ user: { id: faculty.id, name: faculty.name, username: faculty.username, email: faculty.email } });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ message: 'Failed to fetch profile' });
  }
}

export async function updateProfile(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { name, email, username } = req.body as { name?: string; email?: string; username?: string };
    if (!name || !email || !username) {
      res.status(400).json({ message: 'name, email, and username are required' });
      return;
    }

    // Ensure uniqueness excluding current user
    const emailClash = await Faculty.findOne({ email, _id: { $ne: userId } });
    if (emailClash) {
      res.status(409).json({ message: 'Email already in use' });
      return;
    }

    const usernameClash = await Faculty.findOne({ username, _id: { $ne: userId } });
    if (usernameClash) {
      res.status(409).json({ message: 'Username already taken' });
      return;
    }

    const faculty = await Faculty.findById(userId);
    if (!faculty) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    faculty.name = name.trim();
    faculty.email = email.trim().toLowerCase();
    faculty.username = username.trim().toLowerCase();
    await faculty.save();

    res.json({ user: { id: faculty.id, name: faculty.name, username: faculty.username, email: faculty.email } });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ message: 'Failed to update profile' });
  }
}

export async function changePassword(req: Request, res: Response): Promise<void> {
  try {
    const userId = req.userId;
    if (!userId) {
      res.status(401).json({ message: 'Unauthorized' });
      return;
    }

    const { oldPassword, newPassword, confirmPassword } = req.body as { oldPassword?: string; newPassword?: string; confirmPassword?: string };
    if (!oldPassword || !newPassword || !confirmPassword) {
      res.status(400).json({ message: 'oldPassword, newPassword and confirmPassword are required' });
      return;
    }

    if (newPassword !== confirmPassword) {
      res.status(400).json({ message: 'New password and confirm password do not match' });
      return;
    }

    if (newPassword.length < 6) {
      res.status(400).json({ message: 'Password must be at least 6 characters long' });
      return;
    }

    const faculty = await Faculty.findById(userId);
    if (!faculty) {
      res.status(404).json({ message: 'User not found' });
      return;
    }

    const isMatch = await faculty.comparePassword(oldPassword);
    if (!isMatch) {
      res.status(401).json({ message: 'Old password is incorrect' });
      return;
    }

    faculty.password = newPassword;
    await faculty.save();

    res.json({ message: 'Password updated successfully' });
  } catch (error) {
    console.error('Change password error:', error);
    res.status(500).json({ message: 'Failed to change password' });
  }
}


