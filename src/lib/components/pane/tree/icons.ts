import { Braces, Coffee, File, Text, Image, Code } from "lucide-svelte";
import type { ComponentType, SvelteComponent } from "svelte";

export type Icon = ComponentType<SvelteComponent<{ size?: number | string; class?: string }>>;

export const pickIcon = (label: string): { icon: Icon; classes: string[] } => {
    const dotIndex = label.lastIndexOf(".");
    if (dotIndex !== -1) {
        switch (label.substring(dotIndex + 1)) {
            case "java":
            case "class":
                return { icon: Coffee, classes: ["text-red-500"] };
            case "json":
                return { icon: Braces, classes: ["text-green-500"] }
            case "jpg":
            case "jpeg":
            case "png":
            case "gif":
                return { icon: Image, classes: ["text-blue-500"] }
            case "html":
            case "xml":
            case "xhtml":
            case "mhtml":
            case "htm":
                return { icon: Code, classes: ["text-green-600"] }
            case "txt":
                return { icon: Text, classes: [] };
        }
    }

    return { icon: File, classes: [] };
};
