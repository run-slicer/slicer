import { TabPosition, TabType } from "$lib/tab";
import { type ClassEntry, type Entry, EntryType } from "$lib/workspace";
import {
    Binary,
    Braces,
    CodeXml,
    Coffee,
    File,
    FileArchive,
    FileCode2,
    FileDigit,
    FileText,
    GitPullRequest,
    Image,
    InspectionPanel,
    type Icon as LucideIcon,
    PanelBottom,
    PanelBottomDashed,
    PanelLeft,
    PanelLeftDashed,
    PanelRight,
    PanelRightDashed,
    Parentheses,
    Sparkles,
    Text,
    TextQuote,
} from "@lucide/svelte";
import type { Component } from "svelte";
import Android from "./android.svelte";
import Abstract from './java/abstract.svelte'
import Annotation from './java/annotation.svelte'
import Class from './java/class.svelte'
import Enum from './java/enum.svelte'
import Interface from './java/interface.svelte'
import Record from './java/record.svelte'
import GitHub from "./github.svelte";
import Kotlin from "./kotlin.svelte";

export type Icon = Component<LucideIcon>;

export interface StyledIcon {
    icon: Icon;
    classes?: string[];
}

export const tabIcon = (tabType: TabType, entry: Entry, entries: Entry[]): StyledIcon => {
    switch (tabType) {
        case TabType.WELCOME:
            return { icon: Sparkles, classes: ["text-muted-foreground"] };
        case TabType.HEX:
            return { icon: Binary, classes: ["text-muted-foreground"] };
        case TabType.GRAPH:
            return { icon: GitPullRequest, classes: ["text-muted-foreground"] };
        case TabType.CLASS:
            return { icon: FileCode2, classes: ["text-red-500"] };
    }

    return entryIcon(entry, entries);
};

export const entryIcon = (entry: Entry, entries: Entry[]): StyledIcon => {
    switch (entry.type) {
        case EntryType.MEMBER:
            return { icon: Parentheses, classes: ["text-red-500"] };
    }

    const getFullName = (entry: Entry): string => {
        const labels: string[] = [];
        let current: Entry | undefined = entry;

        while (current && current.label !== "<root>") {
            labels.unshift(current.name);
            current = current.parent;
        }

        return labels.join("/");
    };

    const name = getFullName(entry);

    return fileIcon(name, entries);
};

function parseClassModifiers(modifiers: number) {
    return {
        isPublic: (modifiers & 0x0001) !== 0,
        isFinal: (modifiers & 0x0010) !== 0,
        isSuper: (modifiers & 0x0020) !== 0,
        isInterface: (modifiers & 0x0200) !== 0,
        isAbstract: (modifiers & 0x0400) !== 0,
        isSynthetic: (modifiers & 0x1000) !== 0,
        isAnnotation: (modifiers & 0x2000) !== 0,
        isEnum: (modifiers & 0x4000) !== 0,
        isRecord: (modifiers & 0x10000) !== 0, // Java 14+
    };
}

export const fileIcon = (label: string, entries: Entry[]): StyledIcon => {
    const dotIndex = label.lastIndexOf(".");
    if (dotIndex !== -1) {
        switch (label.substring(dotIndex + 1)) {
            case "java":
            case "class":
                if (entries) {
                    const entryFound = Array.from(entries).find((entry) => entry.name == label);

                    if (entryFound) {
                        const classEntry = entryFound as ClassEntry;
                        const node = classEntry.node

                    
                        if (node) {
                            const data = parseClassModifiers(node.access);

                             if (data.isAbstract && !data.isInterface) {
                                return { icon: Abstract, classes: [] };
                            } else if (data.isAnnotation) {
                                return { icon: Annotation, classes: [] };
                            } else if (data.isRecord) {
                                return { icon: Record, classes: [] };
                            } else if (data.isInterface) {
                                return { icon: Interface, classes: [] };
                            } else if (data.isEnum) {
                                return { icon: Enum, classes: [] };
                            } else {
                                return { icon: Class, classes: [] };
                            }
                        }
                    }
                }

                return { icon: Coffee, classes: ["text-red-500"] };
            case "kt":
            case "kts":
                return { icon: Kotlin };
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
            case "svg":
                return { icon: CodeXml, classes: ["text-green-600"] };
            case "yaml":
            case "yml":
                return { icon: TextQuote, classes: ["text-green-500"] };
            case "jar":
                return { icon: FileArchive, classes: ["text-red-500"] };
            case "apk":
                return { icon: Android };
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

export const paneIcon = (pos: TabPosition, open: boolean): Icon => {
    switch (pos) {
        case TabPosition.PRIMARY_BOTTOM:
            return open ? PanelBottom : PanelBottomDashed;
        case TabPosition.PRIMARY_CENTER:
            return InspectionPanel;
        case TabPosition.SECONDARY_LEFT:
            return open ? PanelLeft : PanelLeftDashed;
        case TabPosition.SECONDARY_RIGHT:
            return open ? PanelRight : PanelRightDashed;
    }
};

export { Android, GitHub, Kotlin };
