import { requireAdmin } from './requireAdmin';

/**
 * Stricter than requireAdmin — only passes for admins whose role is
 * 'super_admin'. Use this for admin-management and financial routes.
 */
export async function requireSuperAdmin(req) {
  const check = await requireAdmin(req);
  if (check.error) return check;
  if (check.admin.role !== 'super_admin') {
    return { error: 'This page is restricted to super-admins', status: 403 };
  }
  return check;
}
