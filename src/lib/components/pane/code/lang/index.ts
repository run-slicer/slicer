import type { LanguageSupport } from "@codemirror/language";
import type { Entry } from "$lib/workspace";

export type Language = "java" | "xml" | "json" | "yaml" | "properties" | "hex" | "plaintext";

export const load = async (lang: Language): Promise<LanguageSupport | null> => {
    switch (lang) {
        case "java":
            return (await import("@codemirror/lang-java")).java();
        case "xml":
            return (await import("@codemirror/lang-xml")).xml();
        case "json":
            return (await import("@codemirror/lang-json")).json();
        case "yaml":
            return (await import("@codemirror/lang-yaml")).yaml();
        case "properties":
            return (await import("./properties")).properties();
        case "hex":
            return (await import("./hex")).hex();
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
        case "yaml":
        case "yml":
            return "yaml";
        case "properties":
            return "properties";
    }

    return "plaintext";
};

export const fromEntry = (entry: Entry): Language => {
    return entry.data.extension ? fromExtension(entry.data.extension) : "plaintext";
};
