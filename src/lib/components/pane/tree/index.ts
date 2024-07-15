import type { Entry } from "$lib/workspace";
import { addToast } from "$lib/components/toaster.svelte";
import { open, remove } from "$lib/action";
import { Braces, Coffee, File, Text, Image, Code, TextQuote, FileArchive, FileText } from "lucide-svelte";
import type { Icon } from "$lib/components/icons";

export interface Node {
    label: string;
    entry?: Entry;
    parent?: Node;
    nodes?: Node[];
    expanded?: boolean;
}

const deleteNode = (node: Node): number => {
    if (node.nodes) {
        return node.nodes.reduce((acc, v) => acc + deleteNode(v), 0);
    }

    if (node.entry) {
        remove(node.entry, true);
        return 1;
    }
    return 0;
};

export const openEntry = (data: Node) => open(data.entry!);

export const deleteEntry = (data: Node) => {
    if (data.nodes) {
        const num = deleteNode(data);

        addToast({
            title: "Deleted",
            description: `Deleted ${num} ${num !== 1 ? "entries" : "entry"}.`,
        });
    } else if (data.entry) {
        remove(data.entry);
    }
};

export const pickIcon = (label: string): { icon: Icon; classes: string[] } => {
    const dotIndex = label.lastIndexOf(".");
    if (dotIndex !== -1) {
        switch (label.substring(dotIndex + 1)) {
            case "java":
            case "class":
                return { icon: Coffee, classes: ["text-red-500"] };
            case "json":
                return { icon: Braces, classes: ["text-green-500"] };
            case "jpg":
            case "jpeg":
            case "png":
            case "gif":
                return { icon: Image, classes: ["text-blue-500"] };
            case "html":
            case "xml":
            case "xhtml":
            case "mhtml":
            case "htm":
                return { icon: Code, classes: ["text-green-600"] };
            case "yaml":
            case "yml":
                return { icon: TextQuote, classes: ["text-green-500"] };
            case "jar":
                return { icon: FileArchive, classes: ["text-red-500"] };
            case "zip":
            case "tar":
            case "gz":
            case "rar":
            case "lzma":
                return { icon: FileArchive, classes: [] };
            case "properties":
            case "md":
            case "rst":
            case "adoc":
                return { icon: FileText, classes: [] };
            case "txt":
                return { icon: Text, classes: [] };
        }
    }

    return { icon: File, classes: [] };
};
