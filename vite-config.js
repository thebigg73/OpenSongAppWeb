import { defineConfig } from 'vite'
import singlefile from 'vite-plugin-singlefile'

export default defineConfig({
  base: '/OpenSongAppWeb/',
  plugins: [singlefile()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: 'src/index.html', // Explicitly points Vite to your source index file
    },
  },
})
