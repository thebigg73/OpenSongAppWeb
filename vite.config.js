import { defineConfig } from "vite";
import path from "node:path";

export default defineConfig({
  base: "./",
  assetsInclude: ["**/*.mid", "**/*.ost"],
  plugins: [
    {
      name: "inline-to-singlefile",
      enforce: "post",
      generateBundle(options, bundle) {
        // 1. First, convert any binary assets (like .mid files) into Base64 Data URIs
        // and replace their filenames in the code chunks before we inline JS/CSS.
        const assetMap = {};

        for (const fileName of Object.keys(bundle)) {
          if (fileName.endsWith(".mid") || fileName.endsWith(".ost")) {
            const asset = bundle[fileName];
            const buffer = asset.source; // Buffer or Uint8Array
            const base64 = Buffer.isBuffer(buffer) ? buffer.toString("base64") : Buffer.from(buffer).toString("base64");

            // Guess mime type
            const mime = fileName.endsWith(".mid") ? "audio/midi" : "application/octet-stream";
            const dataUri = `data:${mime};base64,${base64}`;

            // Map original asset filename / reference name to its new Data URI
            assetMap[fileName] = dataUri;
            assetMap[path.basename(fileName)] = dataUri;

            // Remove the separate binary asset file from the bundle
            delete bundle[fileName];
          }
        }

        // 2. Locate the output HTML file
        const htmlKey = Object.keys(bundle).find((fileName) => fileName.endsWith(".html"));
        if (!htmlKey) return;

        const htmlAsset = bundle[htmlKey];
        let htmlContent = typeof htmlAsset.source === "string" ? htmlAsset.source : htmlAsset.source.toString("utf8");

        // 3. Inline CSS and JS chunks directly into the HTML, and replace asset references with Data URIs
        for (const fileName of Object.keys(bundle)) {
          if (fileName.endsWith(".css")) {
            const cssContent = bundle[fileName].source;
            const baseName = path.basename(fileName);
            htmlContent = htmlContent.replace(
              new RegExp(`<link[^>]*rel=["']stylesheet["'][^>]*href=["'][^"']*${baseName}["'][^>]*>`),
              `<style>\n${cssContent}\n</style>`
            );
            delete bundle[fileName];
          } else if (fileName.endsWith(".js")) {
            let jsContent = bundle[fileName].code;
            const baseName = path.basename(fileName);

            // Replace any imported/referenced .mid paths in the JS code with their Base64 Data URIs
            for (const [assetName, dataUri] of Object.entries(assetMap)) {
              const regex = new RegExp(assetName, "g");
              jsContent = jsContent.replace(regex, dataUri);
            }

            htmlContent = htmlContent.replace(
              new RegExp(`<script[^>]*type=["']module["'][^>]*src=["'][^"']*${baseName}["'][^>]*></script>`),
              `<script type="module">\n${jsContent}\n</script>`
            );
            delete bundle[fileName];
          }
        }

        // Also do a global sweep on the final HTML just in case any asset path ended up there
        for (const [assetName, dataUri] of Object.entries(assetMap)) {
          htmlContent = htmlContent.split(assetName).join(dataUri);
        }

        htmlAsset.source = htmlContent;
      }
    }
  ],
  build: {
    outDir: "dist",
    emptyOutDir: true,
    cssCodeSplit: false,
    chunkSizeWarningLimit: 2000 // Raised slightly since MIDI base64 strings will increase JS bundle size
  }
});
