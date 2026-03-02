export interface MockUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  tenantId: string;
  tenantName: string;
  tenantType: 'BUSINESS' | 'VENDOR';
  role: string;
}

const USER_KEY  = 'sf_user';
const TOKEN_KEY = 'sf_token';

export function getStoredUser(): MockUser | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(USER_KEY);
    return raw ? (JSON.parse(raw) as MockUser) : null;
  } catch { return null; }
}

export function getStoredToken(): string | null {
  if (typeof window === 'undefined') return null;
  return localStorage.getItem(TOKEN_KEY);
}

export function storeAuth(token: string, user: MockUser): void {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
}

export function clearAuth(): void {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
}

export function portalPath(user: MockUser): string {
  if (user.role === 'SUPER_ADMIN') return '/admin/dashboard';
  if (user.tenantType === 'VENDOR') return '/vendor/dashboard';
  return '/dashboard';
}
