import { defineConfig } from "vite";
import { resolve } from "path";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { sveltePreprocess } from "svelte-preprocess";
import sitemap from "vite-plugin-sitemap";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        svelte({
            preprocess: [
                sveltePreprocess({
                    replace: [
                        [/process\.env\.APP_BRANCH/g, JSON.stringify(process.env.CF_PAGES_BRANCH || "unknown")],
                        [
                            /process\.env\.APP_COMMIT/g,
                            JSON.stringify(process.env.CF_PAGES_COMMIT_SHA?.substring(0, 7) || "0000000"),
                        ],
                    ],
                }),
            ],
        }),
        sitemap({
            hostname: "https://slicer.run/" /* process.env.CF_PAGES_URL || "http://localhost/" */,
            changefreq: "never", // it's an SPA
        }),
    ],
    build: {
        sourcemap: "hidden",
    },
    resolve: {
        alias: {
            $lib: resolve("./src/lib"),
        },
    },
    worker: {
        format: "es",
    },
});
