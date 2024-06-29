import { githubDarkInit, githubLightInit } from "@uiw/codemirror-theme-github";

const projectSettings = {
    background: "hsl(var(--background))",
    foreground: "hsl(var(--foreground))",
    gutterBackground: "hsl(var(--background))",
    gutterForeground: "hsl(var(--muted-foreground))",
};

export const dark = githubDarkInit({ settings: projectSettings });
export const light = githubLightInit({ settings: projectSettings });
