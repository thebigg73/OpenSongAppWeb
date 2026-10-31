"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.replaceScript = replaceScript;
exports.replaceCss = replaceCss;
exports.findCspProblems = findCspProblems;
exports.viteSingleFile = viteSingleFile;
const vite_1 = require("vite");
const picomatch_1 = __importDefault(require("picomatch"));
const viteMajor = parseInt(vite_1.version.split(".")[0], 10);
const defaultConfig = { useRecommendedBuildConfig: true, removeViteModuleLoader: false, deleteInlinedFiles: true };
function replaceScript(html, scriptFilename, scriptCode, removeViteModuleLoader = false) {
    const f = scriptFilename.replaceAll(".", "\\.");
    const reScript = new RegExp(`<script([^>]*?) src="(?:[^"]*?/)?${f}"([^>]*)></script>`);
    const preloadMarker = /"?__VITE_PRELOAD__"?/g;
    const newCode = scriptCode.replace(preloadMarker, "void 0").replace(/<(\/script>|!--)/g, "\\x3C$1");
    const inlined = html.replace(reScript, (_, beforeSrc, afterSrc) => `<script${beforeSrc}${afterSrc}>${newCode.trim()}</script>`);
    return removeViteModuleLoader ? _removeViteModuleLoader(inlined) : inlined;
}
function replaceCss(html, scriptFilename, scriptCode) {
    const f = scriptFilename.replaceAll(".", "\\.");
    const reStyle = new RegExp(`<link([^>]*?) href="(?:[^"]*?/)?${f}"([^>]*)>`);
    const newCode = scriptCode.replace(`@charset "UTF-8";`, "");
    const inlined = html.replace(reStyle, (_, beforeSrc, afterSrc) => `<style${beforeSrc}${afterSrc}>${newCode.trim()}</style>`);
    return inlined;
}
// Inlining turns external files into inline code, which a Content-Security-Policy meta tag may block. This returns
// a message for each kind of inline code ("script" or "style") that a CSP meta in the HTML would block. Only
// `<meta>` policies are visible to the plugin; policies sent as HTTP headers are not checked.
function findCspProblems(html, inlinedScript, inlinedStyle) {
    const problems = [];
    const metas = html.match(/<meta\b[^>]*>/gi) ?? [];
    for (const meta of metas) {
        if (!/http-equiv\s*=\s*["']?content-security-policy["']?(?=[\s/>])/i.test(meta))
            continue;
        const content = /\bcontent\s*=\s*(?:"([^"]*)"|'([^']*)')/i.exec(meta);
        if (!content)
            continue;
        const directives = new Map();
        for (const part of (content[1] ?? content[2]).split(";")) {
            const [name, ...sources] = part.trim().split(/\s+/);
            if (name && !directives.has(name.toLowerCase()))
                directives.set(name.toLowerCase(), sources);
        }
        const blocks = (names) => {
            const sources = names.map((n) => directives.get(n)).find((v) => v !== undefined);
            if (!sources)
                return false;
            // A hash or nonce makes browsers ignore 'unsafe-inline'; we can't verify they match, so assume the author did.
            return !sources.some((v) => /^'(unsafe-inline|nonce-.+|sha(256|384|512)-.+)'$/i.test(v));
        };
        if (inlinedScript && blocks(["script-src-elem", "script-src", "default-src"]))
            problems.push("script");
        if (inlinedStyle && blocks(["style-src-elem", "style-src", "default-src"]))
            problems.push("style");
    }
    return [...new Set(problems)].map((kind) => `The Content-Security-Policy meta tag does not allow inline ${kind === "script" ? "<script>" : "<style>"} code, which is now inlined in the HTML. ` +
        `Add 'unsafe-inline', or a 'sha256-...' hash or nonce, to ${kind === "script" ? "script-src" : "style-src"}.`);
}
const isJsFile = /\.[mc]?js$/;
const isCssFile = /\.css$/;
const isHtmlFile = /\.html?$/;
function viteSingleFile({ useRecommendedBuildConfig = true, removeViteModuleLoader = false, inlinePattern = [], deleteInlinedFiles = true, outputFileName, overrideConfig = {}, } = defaultConfig) {
    // Modifies the Vite build config to make this plugin work well.
    const _useRecommendedBuildConfig = (config) => {
        if (!config.build)
            config.build = {};
        // Ensures that even very large assets are inlined in your JavaScript.
        config.build.assetsInlineLimit = () => true;
        // Avoid warnings about large chunks.
        config.build.chunkSizeWarningLimit = 100000000;
        // Emit all CSS as a single file, which `vite-plugin-singlefile` can then inline.
        config.build.cssCodeSplit = false;
        // We need relative path to support any static files in public folder,
        // which are copied to ${build.outDir} by vite.
        config.base = "./";
        // Make generated files in ${build.outDir}'s root, instead of default ${build.outDir}/assets.
        // Then the embedded resources can be loaded by relative path.
        config.build.assetsDir = "";
        Object.assign(config, overrideConfig);
    };
    let singleInput = true;
    return {
        name: "vite:singlefile",
        config: useRecommendedBuildConfig ? _useRecommendedBuildConfig : undefined,
        enforce: "post",
        // Disabling code splitting is only valid for single-input builds. Multi-input builds (such as the
        // SSR and client builds of SvelteKit) are left alone, since Rollup/Rolldown reject the option (#122).
        options: useRecommendedBuildConfig
            ? (opts) => {
                const input = opts.input;
                singleInput = !input || typeof input === "string" || (Array.isArray(input) ? input.length <= 1 : Object.keys(input).length <= 1);
                return null;
            }
            : undefined,
        outputOptions: useRecommendedBuildConfig
            ? (out) => {
                if (!singleInput)
                    return null;
                // Ensure that as many resources as possible are inlined.
                // Vite 8+ (Rolldown) uses codeSplitting:false; earlier versions use inlineDynamicImports:true
                return (viteMajor >= 8 ? { ...out, codeSplitting: false } : { ...out, inlineDynamicImports: true });
            }
            : undefined,
        generateBundle: { order: "post", handler(_options, bundle) {
                const warnNotInlined = (filename) => this.info(`NOTE: asset not inlined: ${filename}`);
                this.info("\n");
                const files = {
                    html: [],
                    css: [],
                    js: [],
                    other: [],
                };
                for (const i of Object.keys(bundle)) {
                    if (isHtmlFile.test(i)) {
                        files.html.push(i);
                    }
                    else if (isCssFile.test(i)) {
                        files.css.push(i);
                    }
                    else if (isJsFile.test(i)) {
                        files.js.push(i);
                    }
                    else {
                        files.other.push(i);
                    }
                }
                const bundlesToDelete = [];
                for (const name of files.html) {
                    const htmlChunk = bundle[name];
                    let replacedHtml = htmlChunk.source;
                    let inlinedScript = false;
                    let inlinedStyle = false;
                    for (const filename of files.js) {
                        if (inlinePattern.length && !picomatch_1.default.isMatch(filename, inlinePattern)) {
                            warnNotInlined(filename);
                            continue;
                        }
                        const jsChunk = bundle[filename];
                        if (jsChunk.code != null) {
                            this.info(`Inlining: ${filename}`);
                            bundlesToDelete.push(filename);
                            const before = replacedHtml;
                            replacedHtml = replaceScript(replacedHtml, jsChunk.fileName, jsChunk.code, removeViteModuleLoader);
                            inlinedScript ||= replacedHtml !== before;
                        }
                    }
                    for (const filename of files.css) {
                        if (inlinePattern.length && !picomatch_1.default.isMatch(filename, inlinePattern)) {
                            warnNotInlined(filename);
                            continue;
                        }
                        const cssChunk = bundle[filename];
                        this.info(`Inlining: ${filename}`);
                        bundlesToDelete.push(filename);
                        const before = replacedHtml;
                        replacedHtml = replaceCss(replacedHtml, cssChunk.fileName, cssChunk.source);
                        inlinedStyle ||= replacedHtml !== before;
                    }
                    for (const problem of findCspProblems(replacedHtml, inlinedScript, inlinedStyle)) {
                        this.warn(`${name}: ${problem}`);
                    }
                    htmlChunk.source = replacedHtml;
                }
                if (deleteInlinedFiles) {
                    for (const name of bundlesToDelete) {
                        delete bundle[name];
                    }
                }
                if (outputFileName) {
                    if (files.html.length === 1 && files.html[0] !== outputFileName) {
                        const htmlChunk = bundle[files.html[0]];
                        delete bundle[files.html[0]];
                        // Assigning new keys on `bundle` isn't supported by Rolldown, so emit a new asset instead.
                        this.emitFile({ type: "asset", fileName: outputFileName, source: htmlChunk.source });
                    }
                    else if (files.html.length !== 1) {
                        this.warn(`outputFileName ignored: expected exactly one HTML file, found ${files.html.length}`);
                    }
                }
                for (const name of files.other) {
                    warnNotInlined(name);
                }
            } },
    };
}
// Optionally remove the Vite module loader since it's no longer needed because this plugin has inlined all code.
// This assumes that the Module Loader is (1) the FIRST function declared in the module, (2) an IIFE, (4) is within
// a script with no unexpected attribute values, and (5) that the containing script is the first script tag that
// matches the above criteria. Changes to the SCRIPT tag especially could break this again in the future. It should
// work whether `minify` is enabled or not.
// Update example:
// https://github.com/richardtallent/vite-plugin-singlefile/issues/57#issuecomment-1263950209
const _removeViteModuleLoader = (html) => html.replace(/(<script type="module" crossorigin>\s*)\(function(?: polyfill)?\(\)\s*\{[\s\S]*?\}\)\(\);/, '<script type="module">');
