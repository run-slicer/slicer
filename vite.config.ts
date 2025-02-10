import { svelte } from "@sveltejs/vite-plugin-svelte";
import { resolve } from "path";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [svelte()],
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
    envPrefix: "CF_PAGES_", // expose Pages env variables
});
