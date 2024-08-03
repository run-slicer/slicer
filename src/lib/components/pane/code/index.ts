import { type ClassEntry, type Entry, EntryType } from "$lib/workspace";
import { View } from "$lib/state";
import { current } from "$lib/disasm";
import { get } from "svelte/store";
import { formatHex } from "./hex";
import { timed } from "$lib/action/utils";
import { fromExtension, type Language } from "$lib/lang";

// prettier-ignore
const extensions = {
    // text: new Set(["txt", "yml", "yaml", "MF", "java", "class" /* disassembled */, "properties", "html", "xml", "xhtml", "mhtml", "htm", "json", "md", "rst", "adoc"]),
    binary: new Set(["bin", "tar", "gz", "rar", "zip", "jar", "jpg", "jpeg", "gif", "png", "lzma", "dll", "so", "dylib", "exe", "kotlin_builtins", "kotlin_metadata", "kotlin_module", "nbt"]),
};

export const detectView = (entry: Entry | null): View => {
    const ext = entry?.data?.extension;
    if (!entry || !ext) {
        return View.TEXT;
    }

    // TODO: detect non-ASCII values in file header
    return extensions.binary.has(ext) ? View.HEX : View.TEXT;
};

export const detectLanguage = (view: View, entry: Entry | null): Language => {
    if (!entry) {
        return "plaintext";
    }

    if (view === View.HEX) {
        return "hex";
    } else if (entry.type === EntryType.CLASS) {
        // disassembled view
        return get(current).lang || "plaintext";
    }

    return entry.data.extension ? fromExtension(entry.data.extension) : "plaintext";
};

export const read = async (view: View, entry: Entry | null): Promise<string> => {
    if (!entry) {
        return "";
    }

    const { result } = await timed(`read ${entry.data.name}`, async () => {
        if (view === View.HEX) {
            return await formatHex(entry.data);
        } else if (entry.type === EntryType.CLASS) {
            const disasm = get(current);

            return await disasm.run(entry as ClassEntry);
        }

        return await entry.data.text();
    });

    return result;
};
