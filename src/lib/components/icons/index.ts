import { TabPosition, TabType } from "$lib/tab";
import { type Modifiers, parseModifiers } from "$lib/utils";
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
    type IconProps,
    Image,
    InspectionPanel,
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
import type { Component } from "svelte";
import Android from "./android.svelte";
import GitHub from "./github.svelte";
import AbstractMethod from "./java/abstract-method.svelte";
import Abstract from "./java/abstract.svelte";
import Annotation from "./java/annotation.svelte";
import Class from "./java/class.svelte";
import Constructor from "./java/constructor.svelte";
import Enum from "./java/enum.svelte";
import Field from "./java/field.svelte";
import Interface from "./java/interface.svelte";
import Method from "./java/method.svelte";
import PrivateMember from "./java/private-member.svelte";
import ProtectedMember from "./java/protected-member.svelte";
import PublicMember from "./java/public-member.svelte";
import Record from "./java/record.svelte";
import Kotlin from "./kotlin.svelte";

export type Icon = Component<IconProps>;

export interface JavaIconProps extends IconProps {
    finalMember?: boolean;
    staticMember?: boolean;
}

export const classIcon = (mods: Modifiers, record: boolean = false): Component<JavaIconProps> => {
    if (mods.abstract && !mods.interface) {
        return Abstract;
    } else if (mods.annotation) {
        return Annotation;
    } else if (mods.interface) {
        return Interface;
    } else if (mods.enum) {
        return Enum;
    } else if (record) {
        return Record;
    }

    return Class;
};

export const accessIcon = (mods: Modifiers): Icon | null => {
    if (mods.public) {
        return PublicMember;
    } else if (mods.private) {
        return PrivateMember;
    } else if (mods.protected) {
        return ProtectedMember;
    }

    return null;
};

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

export const entryIcon = (entry: Entry): StyledIcon => {
    switch (entry.type) {
        case EntryType.MEMBER:
            return { icon: Parentheses, classes: ["text-red-500"] };
        case EntryType.CLASS: {
            const node = (entry as ClassEntry).node;
            if (node) {
                const data = parseModifiers(node.access);

                let record = false;
                if (node.superClass) {
                    const superName = (node.pool[node.superClass.name] as UTF8Entry).string;
                    record = superName === "java/lang/Record";
                }

                return { icon: classIcon(data, record) };
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

export {
    Abstract,
    AbstractMethod,
    Android,
    Annotation,
    Class,
    Constructor,
    Enum,
    Field,
    GitHub,
    Interface,
    Kotlin,
    Method,
    PrivateMember,
    ProtectedMember,
    PublicMember,
    Record,
};
