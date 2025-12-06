import react from '@astrojs/react'
import sitemap from '@astrojs/sitemap'
import tailwindcss from '@tailwindcss/vite'
import { defineConfig } from 'astro/config'

const assetPrefix = 'lib/'

export default defineConfig({
	site: 'https://tryequipped.preview.frst.dev',
	output: 'static',
	outDir: 'dist',

	build: {
		inlineStylesheets: 'always',
	},

	experimental: {
		contentIntellisense: true,
	},

	integrations: [react(), sitemap()],

	scopedStyleStrategy: 'class',

	markdown: {
		shikiConfig: {
			theme: 'github-dark',
			wrap: true,
		},
	},

	image: {
		experimentalLayout: 'constrained',
	},

	prefetch: {
		defaultStrategy: 'tap',
		prefetchAll: true,
	},

	vite: {
		plugins: [tailwindcss()] as any,
		resolve: {
			alias: {
				'@': new URL('./src', import.meta.url).pathname,
			},
		},
		build: {
			rollupOptions: {
				output: {
					hashCharacters: 'base36',
					chunkFileNames: `${assetPrefix}/[hash].js`,
					entryFileNames: `${assetPrefix}/[hash].js`,
					assetFileNames(chunkInfo) {
						if (chunkInfo.names.some(x => x.endsWith('.css'))) {
							return `${assetPrefix}/[hash].[ext]`
						}
						if (chunkInfo.names.some(x => x.endsWith('.jpg') || x.endsWith('.jpeg'))) {
							return `${assetPrefix}/[hash].jpeg`
						}
						return `${assetPrefix}/[hash].[ext]`
					},
					banner(chunk) {
						if (chunk.fileName.endsWith('.css') || chunk.fileName.endsWith('.js')) {
							return `/* LABS © ${new Date().getFullYear()} */\n`
						}
						return ''
					},
				},
			},
		},
	},
})
