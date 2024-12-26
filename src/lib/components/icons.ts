import { TabType } from "$lib/tab";
import { type Entry, EntryType } from "$lib/workspace";
import {
    Binary,
    Braces,
    Code,
    Coffee,
    File,
    FileArchive,
    FileCode2,
    FileDigit,
    FileText,
    GitPullRequest,
    Image,
    type Icon as LucideIcon,
    Parentheses,
    Sparkles,
    Text,
    TextQuote,
} from "lucide-svelte";
import type { ComponentType } from "svelte";

export type Icon = ComponentType<LucideIcon> /* Component<IconProps> */;

export interface StyledIcon {
    icon: Icon;
    classes?: string[];
}

export const tabIcon = (tabType: TabType, entry: Entry): StyledIcon => {
    switch (tabType) {
        case TabType.WELCOME:
            return { icon: Sparkles, classes: ["text-muted-foreground"] };
        case TabType.HEX:
            return { icon: Binary, classes: ["text-muted-foreground"] };
        case TabType.FLOW_GRAPH:
            return { icon: GitPullRequest, classes: ["text-muted-foreground"] };
        case TabType.CLASS:
            return { icon: FileCode2, classes: ["text-red-500"] };
    }

    return entryIcon(entry);
};

export const entryIcon = (entry: Entry): StyledIcon => {
    switch (entry.type) {
        case EntryType.MEMBER:
            return { icon: Parentheses, classes: ["text-red-500"] };
    }

    return fileIcon(entry.name);
};

export const fileIcon = (label: string): StyledIcon => {
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
            case "webp":
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
            case "war":
            case "ear":
            case "jmod":
            case "gz":
            case "rar":
            case "lzma":
                return { icon: FileArchive, classes: [] };
            case "hprof":
                return { icon: FileDigit, classes: [] };
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
