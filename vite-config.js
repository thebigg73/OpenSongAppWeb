import { defineConfig } from 'vite'
import singlefile from 'vite-plugin-singlefile'
import { resolve } from 'path'

export default defineConfig({
  base: '/OpenSongAppWeb/',
  plugins: [singlefile()],
  build: {
    outDir: 'dist',          // Cleanly outputs to the dist/ folder
    emptyOutDir: true,       // Clears old builds automatically
    rollupOptions: {
      input: resolve(__dirname, 'src/index.html'), // Pulls from your source folder
    },
  },
})
