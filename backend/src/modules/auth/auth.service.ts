import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Admin } from '@prisma/client';
import prisma from '../../config/database';
import { config } from '../../config';
import { AppError } from '../../middleware/error.middleware';
import {
  RegisterDto,
  LoginDto,
  ChangePasswordDto,
  AuthResponse,
  TokenPayload,
} from './auth.types';

export class AuthService {
  async register(data: RegisterDto): Promise<AuthResponse> {
    // Check if admin already exists
    const existingAdmin = await prisma.admin.findFirst({
      where: {
        OR: [
          { email: data.email },
          { username: data.username },
        ],
      },
    });

    if (existingAdmin) {
      throw new AppError('Username or email already registered', 409);
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(data.password, config.bcryptSaltRounds);

    // Create admin
    const admin = await prisma.admin.create({
      data: {
        username: data.username,
        email: data.email,
        password: hashedPassword,
        firstName: data.firstName,
        lastName: data.lastName,
      },
    });

    // Generate tokens
    const accessToken = this.generateAccessToken(admin);
    const refreshToken = this.generateRefreshToken(admin);

    return {
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
      },
      accessToken,
      refreshToken,
    };
  }

  async login(data: LoginDto): Promise<AuthResponse> {
    // Find admin by username
    const admin = await prisma.admin.findUnique({
      where: {
        username: data.username,
      },
    });

    if (!admin) {
      throw new AppError('Invalid credentials', 401);
    }

    // Verify password
    const isPasswordValid = await bcrypt.compare(data.password, admin.password);

    if (!isPasswordValid) {
      throw new AppError('Invalid credentials', 401);
    }

    // Generate tokens
    const accessToken = this.generateAccessToken(admin);
    const refreshToken = this.generateRefreshToken(admin);

    return {
      admin: {
        id: admin.id,
        username: admin.username,
        email: admin.email,
        firstName: admin.firstName,
        lastName: admin.lastName,
      },
      accessToken,
      refreshToken,
    };
  }

  async getCurrentUser(adminId: string): Promise<Omit<Admin, 'password'>> {
    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
      select: {
        id: true,
        username: true,
        email: true,
        firstName: true,
        lastName: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!admin) {
      throw new AppError('Admin not found', 404);
    }

    return {
      ...admin,
    } as any;
  }

  async changePassword(
    adminId: string,
    data: ChangePasswordDto
  ): Promise<{ message: string }> {
    // Find admin
    const admin = await prisma.admin.findUnique({
      where: { id: adminId },
    });

    if (!admin) {
      throw new AppError('Admin not found', 404);
    }

    // Verify current password
    const isPasswordValid = await bcrypt.compare(data.currentPassword, admin.password);

    if (!isPasswordValid) {
      throw new AppError('Current password is incorrect', 401);
    }

    // Hash new password
    const hashedPassword = await bcrypt.hash(data.newPassword, config.bcryptSaltRounds);

    // Update password
    await prisma.admin.update({
      where: { id: adminId },
      data: { password: hashedPassword },
    });

    return { message: 'Password changed successfully' };
  }

  async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      // Verify refresh token
      const decoded = jwt.verify(refreshToken, config.jwtRefreshSecret) as TokenPayload;

      // Find admin
      const admin = await prisma.admin.findUnique({
        where: { id: decoded.id },
      });

      if (!admin) {
        throw new AppError('Admin not found', 404);
      }

      // Generate new access token
      const accessToken = this.generateAccessToken(admin);

      return { accessToken };
    } catch (error) {
      throw new AppError('Invalid or expired refresh token', 401);
    }
  }

  private generateAccessToken(admin: Admin): string {
    const payload: TokenPayload & { type: string } = {
      id: admin.id,
      username: admin.username,
      email: admin.email,
      type: 'admin',
    };

    return jwt.sign(payload, config.jwtSecret);
  }

  private generateRefreshToken(admin: Admin): string {
    const payload: TokenPayload & { type: string } = {
      id: admin.id,
      username: admin.username,
      email: admin.email,
      type: 'admin',
    };

    return jwt.sign(payload, config.jwtRefreshSecret);
  }
}

export const authService = new AuthService();
