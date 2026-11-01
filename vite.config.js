import { defineConfig } from 'vite'
import path from 'node:path'

export default defineConfig({
  base: './',
  plugins: [
    {
      name: 'inline-to-singlefile',
      enforce: 'post',
      generateBundle(options, bundle) {
        // Locate the output HTML file
        const htmlKey = Object.keys(bundle).find(fileName => fileName.endsWith('.html'));
        if (!htmlKey) return;

        const htmlAsset = bundle[htmlKey];
        let htmlContent = typeof htmlAsset.source === 'string'
          ? htmlAsset.source
          : htmlAsset.source.toString('utf8');

        // Inline CSS and JS chunks directly into the HTML
        for (const fileName of Object.keys(bundle)) {
          if (fileName.endsWith('.css')) {
            const cssContent = bundle[fileName].source;
            const baseName = path.basename(fileName);
            // Replace external CSS link with inline <style>
            htmlContent = htmlContent.replace(
              new RegExp(`<link[^>]*rel=["']stylesheet["'][^>]*href=["'][^"']*${baseName}["'][^>]*>`),
              `<style>\n${cssContent}\n</style>`
            );
            delete bundle[fileName]; // Remove the separate asset file
          } else if (fileName.endsWith('.js')) {
            const jsContent = bundle[fileName].code;
            const baseName = path.basename(fileName);
            // Replace external JS script with inline <script>
            htmlContent = htmlContent.replace(
              new RegExp(`<script[^>]*type=["']module["'][^>]*src=["'][^"']*${baseName}["'][^>]*></script>`),
              `<script type="module">\n${jsContent}\n</script>`
            );
            delete bundle[fileName]; // Remove the separate asset file
          }
        }

        htmlAsset.source = htmlContent;
      }
    }
  ],
  build: {
    outDir: 'dist',
    emptyOutDir: true,
    cssCodeSplit: false,
    chunkSizeWarningLimit: 1000,
  },
})
