/**
 * Test Guard - Prevents accidental use of `bun test`
 *
 * This project uses Vitest, not Bun's built-in test runner.
 * If this file runs, it means someone used `bun test` instead of `bun run test`.
 */

console.error(`
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
❌ ERROR: Wrong test command detected!
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

You ran:     bun test
Should use:  bun run test

This project uses Vitest, not Bun's built-in test runner.

Correct commands:
  ✅ bun run test           # Run all tests
  ✅ bun run test:watch     # Watch mode
  ✅ bun run test:coverage  # Coverage report
  ✅ bun run test:ui        # Visual UI

Why this matters:
- 'bun test' uses Bun's test runner (ignores vitest.config.ts)
- 'bun run test' uses Vitest (proper configuration)

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
`)

process.exit(1)
