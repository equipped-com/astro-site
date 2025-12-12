import react from '@vitejs/plugin-react'
import { getViteConfig } from 'astro/config'
import { loadEnv } from 'vite'
import { defineConfig } from 'vitest/config'

// Load ALL environment variables from .env files (not just VITE_* prefixed)
// This ensures Clerk, Stripe, and other test vars are available in tests
const testEnv = loadEnv('test', process.cwd(), '')

export default defineConfig(
	getViteConfig({
		plugins: [react()],
		test: {
			env: testEnv,
			globals: true,
			environment: 'happy-dom',
			pool: 'forks',
			poolOptions: {
				forks: {
					singleFork: true,
				},
			},
			environmentOptions: {
				happyDOM: {
					settings: {
						disableJavaScriptEvaluation: false,
						disableJavaScriptFileLoading: false,
						disableCSSFileLoading: false,
						disableIframePageLoading: false,
						disableComputedStyleRendering: false,
						enableFileSystemHttpRequests: false,
						navigator: {
							userAgent:
								'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
						},
						device: {
							prefersColorScheme: 'light',
						},
					},
					url: 'http://localhost:3000',
					width: 1024,
					height: 768,
				},
			},
			setupFiles: ['./src/test/dom-setup.ts', './src/test/setup.ts'],
			coverage: {
				provider: 'v8',
				reporter: ['text', 'html', 'json'],
				exclude: [
					'node_modules/',
					'dist/',
					'**/*.test.ts',
					'**/*.test.tsx',
					'**/*.spec.ts',
					'src/test/**',
					'astro.config.ts',
					'vitest.config.ts',
				],
				thresholds: {
					lines: 85,
					functions: 90,
					branches: 80,
					statements: 85,
				},
			},
			include: ['src/**/*.test.ts', 'src/**/*.test.tsx', 'scripts/**/*.test.ts'],
			exclude: ['e2e/**', '**/*.spec.ts'],
		},
		resolve: {
			alias: {
				'@': new URL('./src', import.meta.url).pathname,
			},
		},
	}),
)
