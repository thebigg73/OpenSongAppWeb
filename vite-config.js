import { defineConfig } from 'vite'
import singlefile from 'vite-plugin-singlefile'

export default defineConfig({
  base: './', // Ensures relative path resolution for GitHub Pages
  plugins: [singlefile()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
