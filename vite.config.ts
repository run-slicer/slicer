import { defineConfig } from "vite";
import { resolve } from "path";
import { svelte } from "@sveltejs/vite-plugin-svelte";

// https://vitejs.dev/config/
export default defineConfig({
    plugins: [svelte()],
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
            "@uiw/codemirror-theme-github",
        ],
    },
});
