import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.join(process.cwd(), '.env'), quiet: true });

// JWT_SECRET is mandatory in every environment: there is intentionally no built-in fallback.
const jwtSecret = (process.env.JWT_SECRET || '').trim();
if (!jwtSecret || jwtSecret === 'your_jwt_secret_key_here') {
  throw new Error(
    'JWT_SECRET is not configured. Set a long random value in server/.env (see .env.example) before starting the server.'
  );
}

export const config = {
  PORT: parseInt(process.env.PORT || '5000', 10),
  DATABASE_URL: process.env.DATABASE_URL || 'file:./dev.db',
  JWT_SECRET: jwtSecret,
  NODE_ENV: process.env.NODE_ENV || 'development',
  AI_DEMO_MODE: process.env.AI_DEMO_MODE !== 'false',
  FRONTEND_URL: process.env.FRONTEND_URL || 'http://localhost:5173',
  ALLOWED_ORIGINS: [
    'http://localhost:5173',
    'http://localhost:3000',
    'http://127.0.0.1:5173',
    'http://localhost:5000',
    'http://127.0.0.1:5000',
    ...(process.env.FRONTEND_URL ? [process.env.FRONTEND_URL] : []),
  ],
};
