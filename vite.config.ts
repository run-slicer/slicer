import { svelte } from "@sveltejs/vite-plugin-svelte";
import tailwindcss from "@tailwindcss/vite";
import { readFileSync } from "fs";
import { basename, join, resolve } from "path";
import { defineConfig, PluginOption } from "vite";

const wasmMiddleware: (files: { module: string; file: string }[]) => PluginOption = (files) => {
    return {
        name: "wasm-middleware",
        configureServer(server) {
            server.middlewares.use((req, res, next) => {
                files.forEach((file) => {
                    if (req.url && req.url.endsWith(file.file)) {
                        const wasmPath = join(__dirname, "node_modules/" + file.module, basename(req.url));
                        const wasmFile = readFileSync(wasmPath);
                        res.setHeader("Content-Type", "application/wasm");
                        res.end(wasmFile);
                        return;
                    }
                });
                next();
            });
        },
    };
};

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        tailwindcss(),
        svelte(),
        wasmMiddleware([
            {
                file: "java-remapper.wasm",
                module: "java-remapper",
            },
            {
                file: "jasm.wasm",
                module: "@run-slicer/jasm",
            },
        ]),
    ],
    build: {
        sourcemap: "hidden",
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
