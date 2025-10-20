import { Response } from 'express';
import { coursesService } from './courses.service';
import { asyncHandler } from '../../middleware/error.middleware';
import { AppError } from '../../middleware/error.middleware';
import { AuthRequest } from '../../middleware/auth.middleware';
import {
  createCourseSchema,
  updateCourseSchema,
  courseQuerySchema,
} from './courses.types';

class CoursesController {
  getCourses = asyncHandler(async (req: AuthRequest, res: Response) => {
    const queryParams = courseQuerySchema.parse(req.query);

    // Data Scoping: If staff, force eventId to match their assigned event
    if (req.user?.type === 'staff' && req.user.eventId) {
      queryParams.eventId = req.user.eventId;
    }

    const result = await coursesService.getCourses(queryParams);

    res.status(200).json({
      status: 'success',
      data: result,
    });
  });

  getCourseById = asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const course = await coursesService.getCourseById(id);

    // Data Scoping: If staff, ensure course belongs to their event
    if (req.user?.type === 'staff' && req.user.eventId && course.eventId !== req.user.eventId) {
      throw new AppError('Unauthorized access to this course', 403);
    }

    res.status(200).json({
      status: 'success',
      data: course,
    });
  });

  createCourse = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const validatedData = createCourseSchema.parse(req.body);
    const course = await coursesService.createCourse(validatedData);

    res.status(201).json({
      status: 'success',
      data: course,
    });
  });

  updateCourse = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const { id } = req.params;
    const validatedData = updateCourseSchema.parse(req.body);
    const course = await coursesService.updateCourse(id, validatedData);

    res.status(200).json({
      status: 'success',
      data: course,
    });
  });

  deleteCourse = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const { id } = req.params;
    await coursesService.deleteCourse(id);

    res.status(204).send();
  });

  registerParticipant = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const { courseId, participantId } = req.body;

    if (!courseId || !participantId) {
      throw new AppError('courseId and participantId are required', 400);
    }

    await coursesService.registerParticipant(courseId, participantId);

    res.status(200).json({
      status: 'success',
      message: 'Participant registered successfully',
    });
  });

  importRegistrations = asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.user) {
      throw new AppError('Not authenticated', 401);
    }

    const { id } = req.params;

    if (!req.file) {
      throw new AppError('No file uploaded', 400);
    }

    const result = await coursesService.processBulkRegistration(id, req.file.buffer);

    res.status(200).json({
      status: 'success',
      data: result,
      message: `Processed ${result.success + result.failed} rows. Success: ${result.success}, Failed: ${result.failed}`,
    });
  });
}

export const coursesController = new CoursesController();
