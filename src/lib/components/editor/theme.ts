import { logError, logInfo, logWarn } from "$lib/lang/parser/log";
import { HighlightStyle, syntaxHighlighting, type TagStyle } from "@codemirror/language";
import type { Extension } from "@codemirror/state";
import { EditorView } from "@codemirror/view";
import { tags as t } from "@lezer/highlight";

// modified from @uiw/codemirror-theme-github

interface ThemeOptions {
    dark: boolean;
    settings: Settings;
    styles: TagStyle[];
}

interface Settings {
    caret?: string;
    selection?: string;
    selectionMatch?: string;
    lineHighlight?: string;
}

const createTheme = ({ dark, settings, styles }: ThemeOptions): Extension => {
    const themeOptions: Record<string, Record<string, any>> = {
        "&": {
            backgroundColor: "var(--background)",
            color: "var(--foreground)",
        },
        ".cm-gutters": {
            backgroundColor: "var(--background)",
            color: "var(--muted-foreground)",
        },
    };

    if (settings.caret) {
        themeOptions[".cm-content"] = { caretColor: settings.caret };
        themeOptions[".cm-cursor, .cm-dropCursor"] = { borderLeftColor: settings.caret };
    }

    const activeLineGutterStyle: Record<string, string> = {};
    if (settings.lineHighlight) {
        themeOptions[".cm-activeLine"] = { backgroundColor: settings.lineHighlight };
        activeLineGutterStyle.backgroundColor = settings.lineHighlight;
    }
    themeOptions[".cm-activeLineGutter"] = activeLineGutterStyle;

    if (settings.selection) {
        themeOptions[
            "&.cm-focused .cm-selectionBackground, & .cm-line::selection, & .cm-selectionLayer .cm-selectionBackground, .cm-content ::selection"
        ] = {
            background: settings.selection + " !important",
        };
    }
    if (settings.selectionMatch) {
        themeOptions["& .cm-selectionMatch"] = {
            backgroundColor: settings.selectionMatch,
        };
    }

    const themeExtension = EditorView.theme(themeOptions, { dark });
    return [themeExtension, syntaxHighlighting(HighlightStyle.define(styles))];
};

export const dark = createTheme({
    dark: true,
    settings: {
        caret: "#c9d1d9",
        selection: "#003d73",
        selectionMatch: "#003d73",
        lineHighlight: "#36334280",
    },
    styles: [
        { tag: [t.standard(t.tagName), t.tagName], color: "#7ee787" },
        { tag: [t.comment, t.bracket], color: "#8b949e" },
        { tag: [t.className, t.propertyName], color: "#d2a8ff" },
        { tag: [t.variableName, t.attributeName, t.number, t.operator], color: "#79c0ff" },
        { tag: [t.keyword, t.typeOperator], color: "#ff7b72" },
        { tag: [t.typeName, t.className], color: "#ffa657" },
        { tag: [t.string, t.meta, t.regexp], color: "#a5d6ff" },
        { tag: [t.name, t.quote], color: "#7ee787" },
        { tag: [t.heading, t.strong], color: "#d2a8ff", fontWeight: "bold" },
        { tag: [t.emphasis], color: "#d2a8ff", fontStyle: "italic" },
        { tag: [t.deleted], color: "#ffdcd7", backgroundColor: "ffeef0" },
        { tag: [t.atom, t.bool, t.special(t.variableName)], color: "#ffab70" },
        { tag: t.link, textDecoration: "underline" },
        { tag: t.strikethrough, textDecoration: "line-through" },
        { tag: t.invalid, color: "#f97583" },
        { tag: logInfo, color: "#58a6ff" },
        { tag: logWarn, color: "#d29922" },
        { tag: logError, color: "#f85149" },
    ],
});
export const light = createTheme({
    dark: false,
    settings: {
        selection: "#BBDFFF",
        selectionMatch: "#BBDFFF",
    },
    styles: [
        { tag: [t.standard(t.tagName), t.tagName], color: "#116329" },
        { tag: [t.comment, t.bracket], color: "#6a737d" },
        { tag: [t.className, t.propertyName], color: "#6f42c1" },
        { tag: [t.variableName, t.attributeName, t.number, t.operator], color: "#005cc5" },
        { tag: [t.keyword, t.typeOperator], color: "#d73a49" },
        { tag: [t.typeName, t.className], color: "#e36209" },
        { tag: [t.string, t.meta, t.regexp], color: "#032f62" },
        { tag: [t.name, t.quote], color: "#22863a" },
        { tag: [t.heading, t.strong], color: "#24292e", fontWeight: "bold" },
        { tag: [t.emphasis], color: "#24292e", fontStyle: "italic" },
        { tag: [t.deleted], color: "#b31d28", backgroundColor: "ffeef0" },
        { tag: [t.atom, t.bool, t.special(t.variableName)], color: "#e36209" },
        { tag: [t.url, t.escape, t.regexp, t.link], color: "#032f62" },
        { tag: t.link, textDecoration: "underline" },
        { tag: t.strikethrough, textDecoration: "line-through" },
        { tag: t.invalid, color: "#cb2431" },
        { tag: logInfo, color: "#0366d6" },
        { tag: logWarn, color: "#e36209" },
        { tag: logError, color: "#d73a49" },
    ],
});
