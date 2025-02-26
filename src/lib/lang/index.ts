import type { LanguageSupport } from "@codemirror/language";

export type Language = "java" | "kotlin" | "xml" | "json" | "yaml" | "properties" | "hex" | "jasm" | "plaintext";

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
        case "kotlin":
            return (await import("./parser/kotlin")).kotlin();
        case "properties":
            return (await import("./parser/properties")).properties();
        case "hex":
            return (await import("./parser/hex")).hex();
        case "jasm":
            return (await import("./parser/jasm")).jasm();
    }

    return null;
};

export const toExtension = (lang: Language): string => {
    switch (lang) {
        case "hex":
        case "plaintext":
            return "txt";
        case "kotlin":
            return "kt";
    }

    return lang;
};

export const fromExtension = (ext: string): Language => {
    switch (ext) {
        case "java":
        case "class":
            return "java";
        case "kt":
        case "kts":
            return "kotlin";
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
