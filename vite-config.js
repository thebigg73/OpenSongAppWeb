import { defineConfig } from 'vite'
import singlefile from 'vite-plugin-singlefile'
import { resolve } from 'path'

export default defineConfig({
  base: '/OpenSongAppWeb/',
  plugins: [singlefile()],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    rollupOptions: {
      input: resolve(__dirname, 'src/index.html'),
    },
  },
})
