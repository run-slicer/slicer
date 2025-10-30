import { svelte } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";
import { resolve } from "path";
import { defineConfig } from "vite";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [tailwindcss(), svelte()],
    build: {
        sourcemap: "hidden",
    },
    esbuild: {
        legalComments: "none",
    },
    optimizeDeps: {
        // Vite doesn't like WASM fetches
        exclude: ["@run-slicer/jasm", "@run-slicer/vf"],
    },
    server: {
        fs: {
            strict: false,
        },
    },
    resolve: {
        alias: {
            $lib: resolve("./src/lib"),
        },
    },
    worker: {
        format: "es",
    },
    envPrefix: "WORKERS_CI_", // expose Workers CI env variables
});
