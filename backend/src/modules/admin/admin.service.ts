import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AdminService {
  /**
   * Get dashboard statistics for admin
   */
  async getDashboardStats() {
    try {
      // Get total events count
      const totalEvents = await prisma.event.count();
      
      // Get active events count
      const activeEvents = await prisma.event.count({
        where: { status: 'ACTIVE' }
      });
      
      // Get total participants count (across all events)
      const totalParticipants = await prisma.participant.count();
      
      // Get total staff count (across all events)
      const totalStaff = await prisma.staff.count();
      
      // Get recent events (last 5)
      const recentEvents = await prisma.event.findMany({
        take: 5,
        orderBy: { createdAt: 'desc' },
        include: {
          halls: {
            select: {
              id: true,
              hallFields: true,
            }
          },
          _count: {
            select: { 
              participants: true 
            }
          }
        }
      });
      
      return {
        totalEvents,
        activeEvents,
        totalParticipants,
        totalStaff,
        recentEvents,
      };
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      throw new Error('Failed to fetch dashboard statistics');
    }
  }
}

export const adminService = new AdminService();
