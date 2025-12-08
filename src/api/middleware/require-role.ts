/**
 * Role-Based Access Control Middleware
 *
 * Provides middleware to check user roles against required permissions.
 * Uses role hierarchy: owner > admin > member > buyer > viewer > noaccess
 */
import type { Context, MiddlewareHandler, Next } from 'hono'
import type { Role } from './auth'

/**
 * Role hierarchy levels - higher number = more permissions
 */
const ROLE_HIERARCHY: Record<Role, number> = {
	owner: 5,
	admin: 4,
	member: 3,
	buyer: 2,
	viewer: 1,
	noaccess: 0,
}

/**
 * Human-readable role names for error messages
 */
const ROLE_NAMES: Record<Role, string> = {
	owner: 'Owner',
	admin: 'Admin',
	member: 'Member',
	buyer: 'Buyer',
	viewer: 'Viewer',
	noaccess: 'No Access',
}

/**
 * Middleware factory that checks if user has at least the minimum required role
 *
 * @param minimumRole - The minimum role required to access the route
 * @returns Middleware handler that validates the user's role
 *
 * @example
 * // Require admin or owner role
 * app.use('/api/settings/billing/*', requireRole('admin'))
 */
export function requireRole(minimumRole: Role): MiddlewareHandler {
	return async (c: Context, next: Next) => {
		const userRole = c.get('role') as Role | undefined

		if (!userRole) {
			return c.json(
				{
					error: 'Role not determined',
					message: 'Unable to determine your role in this account',
				},
				403,
			)
		}

		const userLevel = ROLE_HIERARCHY[userRole] ?? 0
		const requiredLevel = ROLE_HIERARCHY[minimumRole] ?? 0

		if (userLevel < requiredLevel) {
			return c.json(
				{
					error: `${ROLE_NAMES[minimumRole]} access required`,
					message: `This action requires ${ROLE_NAMES[minimumRole]} role or higher. Your current role is ${ROLE_NAMES[userRole]}.`,
					required_role: minimumRole,
					your_role: userRole,
				},
				403,
			)
		}

		return next()
	}
}

/**
 * Convenience middleware - requires owner role
 * Use for account-level destructive operations (delete account, transfer ownership)
 */
export function requireOwner(): MiddlewareHandler {
	return requireRole('owner')
}

/**
 * Convenience middleware - requires admin or higher role
 * Use for settings, billing, team management
 */
export function requireAdmin(): MiddlewareHandler {
	return requireRole('admin')
}

/**
 * Convenience middleware - requires member or higher role
 * Use for read-only access to people, devices, orders
 */
export function requireMember(): MiddlewareHandler {
	return requireRole('member')
}

/**
 * Convenience middleware - requires buyer or higher role
 * Use for store access, order creation
 */
export function requireBuyer(): MiddlewareHandler {
	return requireRole('buyer')
}

/**
 * Convenience middleware - requires viewer or higher role
 * Use for basic read access
 */
export function requireViewer(): MiddlewareHandler {
	return requireRole('viewer')
}

/**
 * Check if a role has at least the minimum required level
 */
export function hasRole(userRole: Role | undefined, minimumRole: Role): boolean {
	if (!userRole) return false
	const userLevel = ROLE_HIERARCHY[userRole] ?? 0
	const requiredLevel = ROLE_HIERARCHY[minimumRole] ?? 0
	return userLevel >= requiredLevel
}

/**
 * Get the hierarchy level for a role
 */
export function getRoleLevel(role: Role): number {
	return ROLE_HIERARCHY[role] ?? 0
}

export { ROLE_HIERARCHY, ROLE_NAMES }
