#!/bin/bash
# Cleanup Test Data
#
# Removes synthetic test data from the database
# IMPORTANT: This deletes ALL test data marked with is_synthetic = 1
#
# Usage:
#   ./scripts/cleanup-test-data.sh

set -e

echo "🧹 Cleaning up synthetic test data..."
echo ""

# Confirm action
read -p "Are you sure you want to delete ALL synthetic test data? (y/N): " -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
	echo "Cancelled."
	exit 0
fi

# Delete synthetic data from all tables
echo "Deleting synthetic accounts and related data..."
bunx wrangler d1 execute equipped-db --command="
	DELETE FROM orders WHERE is_synthetic = 1;
	DELETE FROM devices WHERE is_synthetic = 1;
	DELETE FROM users WHERE is_synthetic = 1;
	DELETE FROM accounts WHERE is_synthetic = 1;
"

echo ""
echo "✓ Cleanup complete"
echo "  All synthetic test data has been removed"
