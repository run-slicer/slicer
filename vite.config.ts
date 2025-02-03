import { svelte } from "@sveltejs/vite-plugin-svelte";
import { resolve } from "path";
import { defineConfig } from "vite";
import sitemap from "vite-plugin-sitemap";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        svelte(),
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
