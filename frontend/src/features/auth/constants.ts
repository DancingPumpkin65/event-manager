/**
 * Auth feature constants
 */

export const AUTH_QUERY_KEYS = {
  all: ['auth'] as const,
  session: () => [...AUTH_QUERY_KEYS.all, 'session'] as const,
} as const;

export const AUTH_ENDPOINTS = {
  login: '/api/auth/login',
  logout: '/api/auth/logout',
  session: '/api/auth/session',
} as const;
