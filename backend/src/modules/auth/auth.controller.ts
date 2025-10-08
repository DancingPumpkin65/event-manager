import { Response } from 'express';
import { AuthRequest } from '../../middleware/auth.middleware';
import { asyncHandler, AppError } from '../../middleware/error.middleware';
import { authService } from './auth.service';
import { staffService } from '../staff/staff.service';
import { config } from '../../config';
import {
  registerSchema,
  loginSchema,
  changePasswordSchema,
} from './auth.types';

/**
 * Helper to set authentication cookies
 */
const setAuthCookies = (res: Response, accessToken: string, refreshToken: string) => {
  // Access token cookie - short-lived
  res.cookie('accessToken', accessToken, {
    httpOnly: config.cookie.httpOnly,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
    maxAge: config.cookie.accessTokenMaxAge,
    path: '/',
  });

  // Refresh token cookie - longer-lived, restricted path
  res.cookie('refreshToken', refreshToken, {
    httpOnly: config.cookie.httpOnly,
    secure: config.cookie.secure,
    sameSite: config.cookie.sameSite,
    maxAge: config.cookie.refreshTokenMaxAge,
    path: '/api/auth', // Only sent to auth endpoints
  });
};

/**
 * Helper to clear authentication cookies
 */
const clearAuthCookies = (res: Response) => {
  res.clearCookie('accessToken', { path: '/' });
  res.clearCookie('refreshToken', { path: '/api/auth' });
};

export class AuthController {
  register = asyncHandler(async (req: AuthRequest, res: Response) => {
    // Validate request body
    const validatedData = registerSchema.parse(req.body);

    // Register user
    const result = await authService.register(validatedData);

    // Set cookies
    setAuthCookies(res, result.accessToken, result.refreshToken);

    res.status(201).json({
      status: 'success',
      data: {
        admin: {
          id: result.admin.id,
          username: result.admin.username,
          email: result.admin.email,
          firstName: result.admin.firstName,
          lastName: result.admin.lastName,
        },
      },
    });
  });

  login = asyncHandler(async (req: AuthRequest, res: Response) => {
    // Validate request body
    const validatedData = loginSchema.parse(req.body);

    // Login user
    const result = await authService.login(validatedData);

    // Set cookies
    setAuthCookies(res, result.accessToken, result.refreshToken);

    res.json({
      status: 'success',
      data: {
        admin: {
          id: result.admin.id,
          username: result.admin.username,
          email: result.admin.email,
          firstName: result.admin.firstName,
          lastName: result.admin.lastName,
        },
      },
    });
  });

  getCurrentUser = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    let user;
    if (req.user.type === 'staff') {
      const staff = await staffService.getStaffById(req.user.id);
      if (!staff) {
        throw new AppError('Staff not found', 404);
      }
      // Remove password from response
      const { password, ...staffWithoutPassword } = staff;
      user = staffWithoutPassword;
    } else {
      user = await authService.getCurrentUser(req.user.id);
    }

    res.json({
      status: 'success',
      data: { user },
    });
  });

  changePassword = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    // Validate request body
    const validatedData = changePasswordSchema.parse(req.body);

    // Change password
    const result = await authService.changePassword(req.user.id, validatedData);

    res.json({
      status: 'success',
      data: result,
    });
  });

  refreshToken = asyncHandler(async (req: AuthRequest, res: Response) => {
    // Get refresh token from cookie
    const refreshTokenValue = req.cookies?.refreshToken;

    if (!refreshTokenValue) {
      throw new AppError('Refresh token not provided', 401);
    }

    // Refresh access token
    const result = await authService.refreshAccessToken(refreshTokenValue);

    // Set new access token cookie
    res.cookie('accessToken', result.accessToken, {
      httpOnly: config.cookie.httpOnly,
      secure: config.cookie.secure,
      sameSite: config.cookie.sameSite,
      maxAge: config.cookie.accessTokenMaxAge,
      path: '/',
    });

    res.json({
      status: 'success',
      message: 'Token refreshed successfully',
    });
  });

  logout = asyncHandler(async (_req: AuthRequest, res: Response) => {
    // Clear authentication cookies
    clearAuthCookies(res);

    res.json({
      status: 'success',
      message: 'Logged out successfully',
    });
  });
}

export const authController = new AuthController();

