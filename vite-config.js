import { defineConfig } from 'vite'
import singlefile from 'vite-plugin-singlefile'

export default defineConfig({
  base: '/OpenSongAppWeb/',
  plugins: [singlefile()],
  root: 'src', // Tells Vite to look inside src/ for index.html automatically
  build: {
    outDir: '../dist', // Outputs the bundle back up to the root's dist/ folder
    emptyOutDir: true,
  },
})
