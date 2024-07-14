import type { ClassEntry, Entry } from "$lib/workspace";
import type { View } from "$lib/state";
import { current } from "$lib/disasm";
import { get } from "svelte/store";
import { formatHex } from "./hex";

// prettier-ignore
const extensions = {
    // text: new Set(["txt", "yml", "yaml", "MF", "java", "class" /* disassembled */, "properties", "html", "xml", "xhtml", "mhtml", "htm", "json", "md", "rst", "adoc"]),
    binary: new Set(["bin", "tar", "gz", "rar", "zip", "jar", "jpg", "jpeg", "gif", "png", "lzma", "dll", "so", "dylib", "exe", "kotlin_builtins", "kotlin_metadata", "kotlin_module"]),
};

export const detectView = (entry: Entry | null): View => {
    const ext = entry?.data?.extension;
    if (!entry || !ext) {
        return "text";
    }

    // TODO: detect non-ASCII values in file header
    return extensions.binary.has(ext) ? "hex" : "text";
};

export const read = async (view: View, entry: Entry | null): Promise<string> => {
    if (!entry) {
        return "";
    }

    if (view === "hex") {
        return await formatHex(entry.data);
    } else if (entry.type === "class") {
        const decompiler = get(current);

        return await decompiler.run(entry as ClassEntry);
    }

    return await entry.data.text();
};
