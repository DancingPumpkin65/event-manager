import { Router } from 'express';
import { authController } from './auth.controller';
import { authenticate } from '../../middleware/auth.middleware';
import { rateLimiter } from '../../middleware/rate-limit.middleware';

const router = Router();

// Apply rate limiting to login endpoint (100 requests per 15 minutes)
const loginRateLimiter = rateLimiter({
  windowMs: 15 * 60 * 1000, // 15 minutes
  maxRequests: 100, // Increased for development
});

// Public routes
router.post('/register', authController.register);
router.post('/login', loginRateLimiter, authController.login);
router.post('/refresh', authController.refreshToken);

// Protected routes (require authentication)
router.get('/me', authenticate, authController.getCurrentUser);
router.patch('/password', authenticate, authController.changePassword);
router.post('/logout', authenticate, authController.logout);

export default router;
