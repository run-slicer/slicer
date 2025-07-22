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
    type IconNode,
    type IconProps,
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
import type { UTF8Entry } from "@run-slicer/asm/pool";
import { Modifier } from "@run-slicer/asm/spec";
import { mode } from "mode-watcher";
import type { Component } from "svelte";
import Android from "./android.svelte";
import GitHub from "./github.svelte";
import Abstract from "./java/abstract.svelte";
import Annotation from "./java/annotation.svelte";
import Class from "./java/class.svelte";
import Enum from "./java/enum.svelte";
import Interface from "./java/interface.svelte";
import Record from "./java/record.svelte";
import Kotlin from "./kotlin.svelte";

export type Icon = Component<LucideIcon>;

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
        case TabType.GRAPH:
            return { icon: GitPullRequest, classes: ["text-muted-foreground"] };
        case TabType.CLASS:
            return { icon: FileCode2, classes: ["text-red-500"] };
    }

    return entryIcon(entry);
};

const parseClassModifiers = (modifiers: number) => ({
    isPublic: (modifiers & Modifier.PUBLIC) !== 0,
    isFinal: (modifiers & Modifier.FINAL) !== 0,
    isSuper: (modifiers & Modifier.SUPER) !== 0,
    isInterface: (modifiers & Modifier.INTERFACE) !== 0,
    isAbstract: (modifiers & Modifier.ABSTRACT) !== 0,
    isSynthetic: (modifiers & Modifier.SYNTHETIC) !== 0,
    isAnnotation: (modifiers & Modifier.ANNOTATION) !== 0,
    isEnum: (modifiers & Modifier.ENUM) !== 0,
});

export const entryIcon = (entry: Entry): StyledIcon => {
    switch (entry.type) {
        case EntryType.MEMBER:
            return { icon: Parentheses, classes: ["text-red-500"] };
        case EntryType.CLASS: {
            const classEntry = entry as ClassEntry;
            const node = classEntry.node;

            if (node) {
                const data = parseClassModifiers(node.access);

                if (node.superClass) {
                    const superName = (node.pool[node.superClass.name] as UTF8Entry).string;

                    if (superName === "java/lang/Record") {
                        return { icon: Record, classes: [] };
                    }
                }

                if (data.isAbstract && !data.isInterface) {
                    return { icon: Abstract, classes: [] };
                } else if (data.isAnnotation) {
                    return { icon: Annotation, classes: [] };
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

    return fileIcon(entry.name);
};

export const fileIcon = (label: string): StyledIcon => {
    const dotIndex = label.lastIndexOf(".");
    if (dotIndex !== -1) {
        switch (label.substring(dotIndex + 1)) {
            case "java":
            case "class":
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

export interface JavaIconProps extends IconProps {
    finalMember?: boolean;
    staticMember?: boolean;
}

export const wrapFinal = (node: IconNode) => {
    node.push([
        "path",
        {
            fill: mode.current === "dark" ? "#fff" : "#546e7a",
            d: "m10.395 6.975 -1.165 0.31 -1 -0.565v-1.44l1 -0.565 1.165 0.31 0.26 -0.965 -0.885 -0.235 0.23 -0.885 -0.965 -0.26 -0.31 1.165 -1 0.565L6.5 3.69V2.56l0.855 -0.855L6.645 1 6 1.645 5.355 1 4.645 1.705 5.5 2.56v1.13L4.25 4.41l-1 -0.565 -0.29 -1.165L2 2.94l0.235 0.885 -0.885 0.235 0.26 0.965 1.165 -0.31 1 0.565v1.445l-1 0.565 -1.165 -0.31 -0.26 0.965 0.885 0.235L2 9.06l0.965 0.26 0.31 -1.165 1 -0.565L5.5 8.31v1.13l-0.855 0.855L5.355 11 6 10.355 6.645 11l0.705 -0.705 -0.85 -0.855v-1.13l1.25 -0.725 1 0.565 0.31 1.165 0.94 -0.255 -0.235 -0.885 0.885 -0.235zM4.75 5.28 6 4.555l1.25 0.725v1.44L6 7.445l-1.25 -0.725z",
        },
    ]);
};

export const wrapStatic = (node: IconNode) => {
    node.push([
        "path",
        {
            fill: "#FF5370",
            d: "M2.84 21.87a5 5 0 0 0 2.66 1.105v-1.01a3.97 3.97 0 0 1-1.95-.81m2.95.81v1.01c1-.1 1.92-.5 2.66-1.105l-.715-.715c-.55.43-1.215.72-1.945.81m2.655-1.515.715.715a5 5 0 0 0 1.105-2.665h-1.01a3.97 3.97 0 0 1-.81 1.95M7.5 18A1.5 1.5 0 0 0 6 16.5 1.5 1.5 0 0 0 4.5 18 1.5 1.5 0 0 0 6 19.5 1.5 1.5 0 0 0 7.5 18m-5.465.5h-1.01c.1 1 .5 1.92 1.105 2.66l.715-.715a3.93 3.93 0 0 1-.81-1.945m.81-2.95-.715-.71a5 5 0 0 0-1.105 2.66h1.01c.09-.73.38-1.395.81-1.95m7.12 1.95h1.01c-.1-1-.5-1.92-1.105-2.66l-.715.71c.43.555.72 1.22.81 1.95m-.805-3.37a5 5 0 0 0-2.66-1.105v1.01c.73.09 1.395.38 1.95.81m-2.95-.81v-1.01c-1 .1-1.92.5-2.66 1.105l.71.715a3.97 3.97 0 0 1 1.95-.81",
        },
    ]);
};

export { Abstract, Android, Annotation, Class, Enum, GitHub, Interface, Kotlin, Record };
