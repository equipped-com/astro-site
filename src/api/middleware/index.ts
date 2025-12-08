/**
 * API Middleware Exports
 *
 * Central export point for all API middleware.
 */

export type { AccountAccess, Role, User } from './auth'
// Auth middleware
export {
	authMiddleware,
	getAccountId,
	getRole,
	getUser,
	isSysAdmin,
	requireAccountAccess,
	requireAuth,
} from './auth'

// Role-based access control
export {
	getRoleLevel,
	hasRole,
	ROLE_HIERARCHY,
	ROLE_NAMES,
	requireAdmin,
	requireBuyer,
	requireMember,
	requireOwner,
	requireRole,
	requireViewer,
} from './require-role'

// Tenant middleware
export {
	extractSubdomain,
	RESERVED_SUBDOMAINS,
	requireTenant,
	tenantMiddleware,
} from './tenant'
