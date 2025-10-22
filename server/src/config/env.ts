import dotenv from 'dotenv';

dotenv.config();

function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value || value.trim() === '') {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

function requireNumberEnv(name: string): number {
  const raw = requireEnv(name);
  const num = Number(raw);
  if (Number.isNaN(num)) {
    throw new Error(`Environment variable ${name} must be a number. Received: ${raw}`);
  }
  return num;
}

export const env = {
  port: requireNumberEnv('PORT'),
  mongoUri: requireEnv('MONGODB_URI'),
  jwtSecret: requireEnv('JWT_SECRET'),
  jwtExpiresIn: requireEnv('JWT_EXPIRES_IN'),
  allowLan8081: process.env.ALLOW_LAN_8081 === 'true',
} as const;


