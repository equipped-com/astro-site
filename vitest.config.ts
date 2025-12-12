import react from '@vitejs/plugin-react'
import { getViteConfig } from 'astro/config'
import { defineConfig } from 'vitest/config'

export default defineConfig(
	getViteConfig({
		plugins: [react()],
		test: {
			globals: true,
			environment: 'happy-dom',
			environmentOptions: {
				happyDOM: {
					settings: {
						url: 'http://localhost:3000',
						width: 1024,
						height: 768,
					},
				},
			},
			setupFiles: ['./src/test/setup.ts', './src/test/dom-setup.ts'],
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
			include: ['src/**/*.test.ts', 'src/**/*.test.tsx'],
			exclude: ['e2e/**', '**/*.spec.ts'],
		},
		resolve: {
			alias: {
				'@': new URL('./src', import.meta.url).pathname,
			},
		},
	}),
)
