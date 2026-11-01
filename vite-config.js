import { defineConfig } from 'vite'
import singlefile from 'vite-plugin-singlefile'

export default defineConfig({
  base: './',
  plugins: [singlefile()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
  },
})
