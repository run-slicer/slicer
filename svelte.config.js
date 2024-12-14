import { vitePreprocess } from "@sveltejs/vite-plugin-svelte";

const ignoredWarnings = [
    "state_referenced_locally", // we're using (immediate) $state values in $state defaults, ignore
];

export default {
    // Consult https://svelte.dev/docs#compile-time-svelte-preprocess
    // for more information about preprocessors
    preprocess: vitePreprocess(),
    compilerOptions: {
        warningFilter: (w) => !ignoredWarnings.includes(w.code),
    },
};
