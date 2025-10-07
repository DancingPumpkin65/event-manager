import dotenv from 'dotenv';

dotenv.config();

// Parse CORS origins from env or use defaults
const parseCorsOrigins = (): string[] => {
  const origins = process.env.CORS_ORIGINS || process.env.CORS_ORIGIN;
  if (!origins) {
    return ['http://localhost:5173', 'https://localhost'];
  }
  return origins.split(',').map(o => o.trim());
};

export const config = {
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  databaseUrl: process.env.DATABASE_URL || '',
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key-change-in-production',
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || '15m',
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || 'your-refresh-secret-change-in-production',
  jwtRefreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  bcryptSaltRounds: parseInt(process.env.BCRYPT_SALT_ROUNDS || '10', 10),
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173', // Legacy single origin
  corsOrigins: parseCorsOrigins(),
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict' as const,
    httpOnly: true,
    accessTokenMaxAge: 15 * 60 * 1000, // 15 minutes
    refreshTokenMaxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
  },
};

export const isDevelopment = config.nodeEnv === 'development';
export const isProduction = config.nodeEnv === 'production';
export const isTest = config.nodeEnv === 'test';

