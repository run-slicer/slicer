import type { LanguageSupport } from "@codemirror/language";
import type { Entry } from "$lib/workspace";

export type Language = "java" | "xml" | "json" | "plaintext";

export const load = async (lang: Language): Promise<LanguageSupport | null> => {
    switch (lang) {
        case "java":
            return (await import("@codemirror/lang-java")).java();
        case "xml":
            return (await import("@codemirror/lang-xml")).xml();
        case "json":
            return (await import("@codemirror/lang-json")).json();
    }

    return null;
};

export const fromExtension = (ext: string): Language => {
    switch (ext) {
        case "java":
        case "class":
            return "java";
        case "html":
        case "xml":
        case "xhtml":
        case "mhtml":
        case "htm":
            return "xml";
        case "json":
            return "json";
    }

    return "plaintext";
};

export const fromEntry = (entry: Entry): Language => {
    const name = entry.data.name;

    const dotIndex = name.lastIndexOf(".");
    return dotIndex !== -1 ? fromExtension(name.substring(dotIndex + 1)) : "plaintext";
};
