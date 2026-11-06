import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'
import mdx from '@mdx-js/rollup'
import remarkFrontmatter from 'remark-frontmatter'
import remarkMdxFrontmatter from 'remark-mdx-frontmatter'
import fs from 'node:fs'
import path from 'node:path'
import { fileURLToPath } from 'node:url'

const rootDir = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..')
const mediaDir = path.join(rootDir, 'media')

function serveMedia(): Plugin {
  return {
    name: 'vtm-media',
    configureServer(server) {
      server.middlewares.use('/media', (req, res, next) => {
        const url = decodeURIComponent((req.url ?? '/').split('?')[0])
        const file = path.join(mediaDir, url)
        if (!file.startsWith(mediaDir) || !fs.existsSync(file) || fs.statSync(file).isDirectory()) {
          next()
          return
        }
        res.setHeader('Content-Type', file.endsWith('.json') ? 'application/json' : 'image/png')
        fs.createReadStream(file).pipe(res)
      })
    },
    closeBundle() {
      const dest = path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'dist/media')
      fs.cpSync(mediaDir, dest, { recursive: true })
      const dist = path.dirname(dest)
      const index = path.join(dist, 'index.html')
      if (fs.existsSync(index)) fs.copyFileSync(index, path.join(dist, '404.html'))
    },
  }
}

export default defineConfig({
  base: process.env.PAGES_BASE ?? '/',
  plugins: [
    {
      enforce: 'pre',
      ...mdx({
        remarkPlugins: [remarkFrontmatter, remarkMdxFrontmatter],
        providerImportSource: '@mdx-js/react',
      }),
    },
    react({ include: /\.(jsx|tsx|mdx)$/ }),
    serveMedia(),
  ],
  server: { host: true, fs: { allow: [rootDir] } },
  resolve: {
    alias: {
      '@': path.resolve(path.dirname(fileURLToPath(import.meta.url)), 'src'),
      '@vtm/light': path.join(rootDir, 'shared/light-math.mjs'),
    },
  },
})
