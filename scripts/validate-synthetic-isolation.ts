#!/usr/bin/env bun
/**
 * Validate Synthetic Data Isolation
 *
 * Checks that synthetic test data is properly marked and isolated from production analytics.
 * Run this script periodically to ensure test data doesn't leak into production metrics.
 *
 * Usage:
 *   bun scripts/validate-synthetic-isolation.ts
 */

import { and, eq, like, sum } from 'drizzle-orm'
import { getLocalD1Database } from '../src/lib/db'
import { accounts, devices, orders, users } from '../src/lib/db/schema'

async function validateSyntheticIsolation() {
	console.log('🔍 Validating synthetic data isolation...\n')

	const db = getLocalD1Database()
	let hasErrors = false

	// Check 1: All test emails are marked synthetic
	console.log('Check 1: Test emails marked as synthetic')
	const unmarkedTestEmails = await db
		.select({
			id: accounts.id,
			email: accounts.email,
			subdomain: accounts.subdomain,
			is_synthetic: accounts.is_synthetic,
		})
		.from(accounts)
		.where(
			and(
				like(accounts.email, '%@test.tryequipped.com'),
				eq(accounts.is_synthetic, 0), // Should be 1
			),
		)

	if (unmarkedTestEmails.length > 0) {
		console.error('❌ Test emails not marked synthetic:')
		console.table(unmarkedTestEmails)
		hasErrors = true
	} else {
		console.log('✓ All test emails properly marked\n')
	}

	// Check 2: All test- subdomains are marked synthetic
	console.log('Check 2: Test subdomains marked as synthetic')
	const unmarkedTestSubdomains = await db
		.select({
			id: accounts.id,
			email: accounts.email,
			subdomain: accounts.subdomain,
			is_synthetic: accounts.is_synthetic,
		})
		.from(accounts)
		.where(and(like(accounts.subdomain, 'test-%'), eq(accounts.is_synthetic, 0)))

	if (unmarkedTestSubdomains.length > 0) {
		console.error('❌ Test subdomains not marked synthetic:')
		console.table(unmarkedTestSubdomains)
		hasErrors = true
	} else {
		console.log('✓ All test subdomains properly marked\n')
	}

	// Check 3: All user test emails are marked synthetic
	console.log('Check 3: User test emails marked as synthetic')
	const unmarkedTestUsers = await db
		.select({
			id: users.id,
			email: users.email,
			is_synthetic: users.is_synthetic,
		})
		.from(users)
		.where(and(like(users.email, '%@test.tryequipped.com'), eq(users.is_synthetic, 0)))

	if (unmarkedTestUsers.length > 0) {
		console.error('❌ Test user emails not marked synthetic:')
		console.table(unmarkedTestUsers)
		hasErrors = true
	} else {
		console.log('✓ All test user emails properly marked\n')
	}

	// Check 4: No synthetic data in revenue reports (warning only)
	console.log('Check 4: Synthetic revenue check')
	const syntheticRevenue = await db
		.select({
			total: sum(orders.total_amount),
		})
		.from(orders)
		.innerJoin(accounts, eq(orders.account_id, accounts.id))
		.where(eq(accounts.is_synthetic, 1))

	const totalRevenue = syntheticRevenue[0]?.total || 0
	if (totalRevenue > 0) {
		console.warn(`⚠️  Synthetic revenue exists: $${totalRevenue}`)
		console.warn('   Ensure revenue queries exclude accounts.is_synthetic = 1\n')
	} else {
		console.log('✓ No synthetic revenue found\n')
	}

	// Summary
	console.log('─'.repeat(50))
	if (hasErrors) {
		console.error('❌ Validation failed - test data leaks detected')
		console.error('   Run the following to fix:')
		console.error('   UPDATE accounts SET is_synthetic = 1')
		console.error("   WHERE email LIKE '%@test.tryequipped.com'")
		console.error("      OR subdomain LIKE 'test-%';")
		process.exit(1)
	}

	console.log('✓ Synthetic isolation validation complete')
	console.log('  All test data properly isolated from production metrics')
}

// Run validation
validateSyntheticIsolation().catch(error => {
	console.error('Validation error:', error)
	process.exit(1)
})
