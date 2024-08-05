import { defineConfig } from "vite";
import { resolve } from "path";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { sveltePreprocess } from "svelte-preprocess";
import { version } from "./package.json";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [
        svelte({
            preprocess: [
                sveltePreprocess({
                    replace: [
                        [/process\.env\.APP_VERSION/g, JSON.stringify(version)],
                        [/process\.env\.APP_BRANCH/g, JSON.stringify(process.env.CF_PAGES_BRANCH || "unknown")],
                        [
                            /process\.env\.APP_COMMIT/g,
                            JSON.stringify(process.env.CF_PAGES_COMMIT_SHA?.substring(0, 7) || "0000000"),
                        ],
                    ],
                }),
            ],
        }),
    ],
    resolve: {
        alias: {
            $lib: resolve("./src/lib"),
        },
    },
    optimizeDeps: {
        exclude: [
            "svelte-codemirror-editor",
            "codemirror",
            "@codemirror/lang-java",
            "@codemirror/lang-json",
            "@codemirror/lang-xml",
            "@codemirror/lang-yaml",
            "@codemirror/language",
            "@codemirror/view",
            "@uiw/codemirror-theme-github",
        ],
    },
    build: {
        rollupOptions: {
            output: {
                manualChunks: {
                    xyflow: ["@xyflow/svelte"],
                },
            },
        },
    },
});
