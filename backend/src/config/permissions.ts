export type UserType = 'admin' | 'staff';

export const PERMISSIONS = {
    admin: {
        event: ['create', 'read', 'update', 'delete'],
        eventStats: ['read'],
        course: ['create', 'read', 'update', 'delete'],
        hall: ['create', 'read', 'update', 'delete'],
        participant: ['create', 'read', 'update', 'delete'],
        attendance: ['read'],
        staff: ['create', 'read', 'update', 'delete'],
    },
    staff: {
        event: ['read'],
        participant: ['create', 'read', 'update'],
        attendance: ['create', 'read'],
        course: ['read'],
        hall: ['read'],
    },
} as const;

export type PermissionResource = keyof typeof PERMISSIONS.admin;
