import { Request, Response } from 'express';
import { staffService } from './staff.service';
import jwt from 'jsonwebtoken';
import { config } from '../../config';

export const staffController = {
  async createStaff(req: Request, res: Response) {
    try {
      const { eventId, staffFields, username, password } = req.body;

      if (!eventId || !staffFields || !username || !password) {
        return res.status(400).json({ message: 'eventId, staffFields, username, and password are required' });
      }

      const staff = await staffService.createStaff({
        eventId,
        staffFields,
        username,
        password,
      });

      // Remove password from response
      const { password: _, ...staffWithoutPassword } = staff;

      return res.status(201).json(staffWithoutPassword);
    } catch (error: any) {
      if (error.code === 'P2002') {
        return res.status(400).json({ message: 'Username already exists for this event' });
      }
      console.error('Error creating staff:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  async getAllStaff(req: Request, res: Response) {
    try {
      const { eventId } = req.params;

      const staff = await staffService.getAllStaff(eventId);

      // Remove passwords from response
      const staffWithoutPasswords = staff.map(({ password, ...rest }) => rest);

      return res.json(staffWithoutPasswords);
    } catch (error) {
      console.error('Error fetching staff:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  async getStaffWithFilters(req: Request, res: Response) {
    try {
      const { eventId, search, badgePrinted } = req.query;

      if (!eventId || typeof eventId !== 'string') {
        return res.status(400).json({ message: 'eventId query parameter is required' });
      }

      const filters: { search?: string; badgePrinted?: boolean } = {};

      if (search && typeof search === 'string') {
        filters.search = search;
      }

      if (badgePrinted !== undefined) {
        filters.badgePrinted = badgePrinted === 'true';
      }

      const staff = await staffService.getStaffWithFilters(eventId, filters);

      // Remove passwords from response
      const staffWithoutPasswords = staff.map(({ password, ...rest }) => rest);

      return res.json(staffWithoutPasswords);
    } catch (error) {
      console.error('Error fetching staff with filters:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  async getStaffById(req: Request, res: Response) {
    try {
      const { id } = req.params;

      const staff = await staffService.getStaffById(id);

      if (!staff) {
        return res.status(404).json({ message: 'Staff not found' });
      }

      // Remove password from response
      const { password, ...staffWithoutPassword } = staff;

      return res.json(staffWithoutPassword);
    } catch (error) {
      console.error('Error fetching staff:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  async updateStaff(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { staffFields, username, password } = req.body;

      const staff = await staffService.updateStaff(id, {
        staffFields,
        username,
        password,
      });

      // Remove password from response
      const { password: _, ...staffWithoutPassword } = staff;

      return res.json(staffWithoutPassword);
    } catch (error: any) {
      if (error.code === 'P2002') {
        return res.status(400).json({ message: 'Username already exists for this event' });
      }
      if (error.code === 'P2025') {
        return res.status(404).json({ message: 'Staff not found' });
      }
      console.error('Error updating staff:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  async updateBadgePrint(req: Request, res: Response) {
    try {
      const { id } = req.params;
      const { badgeId, printedBy } = req.body;

      if (!badgeId || !printedBy) {
        return res.status(400).json({ message: 'Badge ID and printed by are required' });
      }

      const staff = await staffService.updateBadgePrint(id, { badgeId, printedBy });

      // Remove password from response
      const { password, ...staffWithoutPassword } = staff;

      return res.json(staffWithoutPassword);
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({ message: 'Staff not found' });
      }
      console.error('Error updating badge print:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  async deleteStaff(req: Request, res: Response) {
    try {
      const { id } = req.params;

      await staffService.deleteStaff(id);

      return res.status(204).send();
    } catch (error: any) {
      if (error.code === 'P2025') {
        return res.status(404).json({ message: 'Staff not found' });
      }
      console.error('Error deleting staff:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },

  async login(req: Request, res: Response) {
    try {
      const { eventId, username, password } = req.body;

      if (!eventId || !username || !password) {
        return res.status(400).json({ message: 'Event ID, username, and password are required' });
      }

      const staff = await staffService.validateStaffCredentials(eventId, username, password);

      if (!staff) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      // Generate JWT token
      const accessToken = jwt.sign(
        { id: staff.id, eventId: staff.eventId, type: 'staff' },
        config.jwtSecret,
        { expiresIn: '24h' }
      );

      // Set HttpOnly cookie
      res.cookie('accessToken', accessToken, {
        httpOnly: config.cookie.httpOnly,
        secure: config.cookie.secure,
        sameSite: config.cookie.sameSite,
        maxAge: 24 * 60 * 60 * 1000, // 24 hours for staff
        path: '/',
      });

      // Remove password from response
      const { password: _, ...staffWithoutPassword } = staff;

      return res.json({
        status: 'success',
        data: {
          staff: staffWithoutPassword,
        }
      });
    } catch (error) {
      console.error('Error during staff login:', error);
      return res.status(500).json({ message: 'Internal server error' });
    }
  },
};

