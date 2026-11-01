import { defineConfig } from 'vite'
import singlefile from 'vite-plugin-singlefile'

export default defineConfig({
  base: './', // Crucial for GitHub Pages subpaths so paths resolve correctly
  plugins: [singlefile()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
