import { Response } from 'express';
import { attendanceService } from './attendance.service';
import { asyncHandler } from '../../middleware/error.middleware';
import { AppError } from '../../middleware/error.middleware';
import { AuthRequest } from '../../middleware/auth.middleware';
import {
  checkInSchema,
  checkOutSchema,
  attendanceQuerySchema,
  scanSchema,
} from './attendance.types';

class AttendanceController {
  getAttendances = asyncHandler(async (req: AuthRequest, res: Response) => {
    const queryParams = attendanceQuerySchema.parse(req.query);

    // Data Scoping: If staff, force eventId to match their assigned event
    if (req.user?.type === 'staff' && req.user.eventId) {
      queryParams.eventId = req.user.eventId;
    }

    const result = await attendanceService.getAttendances(queryParams);

    res.status(200).json({
      status: 'success',
      data: result,
    });
  });

  checkIn = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const validatedData = checkInSchema.parse(req.body);
    const attendance = await attendanceService.checkIn(validatedData);

    res.status(200).json({
      status: 'success',
      data: attendance,
      message: 'Check-in successful',
    });
  });

  checkOut = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const validatedData = checkOutSchema.parse(req.body);
    const attendance = await attendanceService.checkOut(validatedData);

    res.status(200).json({
      status: 'success',
      data: attendance,
      message: 'Check-out successful',
    });
  });

  scan = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const validatedData = scanSchema.parse(req.body);

    // Data Scoping: If staff, ensure they are scanning for their own event
    if (req.user.type === 'staff' && req.user.eventId && validatedData.eventId !== req.user.eventId) {
      throw new AppError('Unauthorized to scan for this event', 403);
    }

    // Pass the staff ID if the user is a staff member
    const scannedByStaffId = req.user.type === 'staff' ? req.user.id : undefined;

    const result = await attendanceService.scan({
      ...validatedData,
      scannedByStaffId,
    });

    res.status(result.alreadyScanned ? 200 : 201).json({
      status: 'success',
      data: result.attendance,
      message: result.message,
    });
  });

  getEventStats = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { eventId } = req.params;

    // Data Scoping: If staff, ensure they are accessing stats for their own event
    if (req.user?.type === 'staff' && req.user.eventId && req.user.eventId !== eventId) {
      throw new AppError('Unauthorized access to this event stats', 403);
    }
    const stats = await attendanceService.getEventStats(eventId);

    res.status(200).json({
      status: 'success',
      data: stats,
    });
  });
}

export const attendanceController = new AttendanceController();
