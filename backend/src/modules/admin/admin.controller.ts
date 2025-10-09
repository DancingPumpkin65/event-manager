import { Request, Response } from 'express';
import { adminService } from './admin.service';

export class AdminController {
  /**
   * GET /api/admin/dashboard/stats
   * Get dashboard statistics
   */
  async getDashboardStats(_req: Request, res: Response) {
    try {
      const stats = await adminService.getDashboardStats();
      
      res.status(200).json({
        status: 'success',
        data: stats,
      });
    } catch (error: any) {
      console.error('Dashboard stats error:', error);
      res.status(500).json({
        status: 'error',
        message: error.message || 'Failed to fetch dashboard statistics',
      });
    }
  }
}

export const adminController = new AdminController();
