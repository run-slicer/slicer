import type { ClassMapping } from "./types";

export const stripComment = (line: string): string => {
    const idx = line.indexOf("#");
    if (idx === 0) return "";
    if (idx !== -1) line = line.substring(0, idx - 1);
    let end = line.length;
    while (end > 1 && line.charAt(end - 1) === " ") end--;
    return end === 0 ? "" : line.substring(0, end);
};

export const rsplit = (str: string | undefined, chr: string, count: number): string[] => {
    const parts: string[] = [];
    let remainder = str ?? "";
    while (count > 0) {
        const idx = remainder.lastIndexOf(chr);
        if (idx === -1) break;
        parts.push(remainder.substring(idx + 1));
        remainder = remainder.substring(0, idx);
        count--;
    }
    parts.push(remainder);
    parts.reverse();
    return parts;
};

export const toDesc = (type: string): string => {
    if (type.endsWith("[]")) {
        return "[" + toDesc(type.substring(0, type.length - 2));
    }
    switch (type) {
        case "int":
            return "I";
        case "void":
            return "V";
        case "boolean":
            return "Z";
        case "byte":
            return "B";
        case "char":
            return "C";
        case "short":
            return "S";
        case "double":
            return "D";
        case "float":
            return "F";
        case "long":
            return "J";
        default:
            // Object type: use 'L' + internal name + ';'
            // If it contains dots, convert them to slashes
            const internalName = type.replace(/\./g, "/");
            return `L${internalName};`;
    }
};

export const swapFirst = (arr: string[]) => {
    if (arr.length >= 2) {
        const tmp = arr[0]!!;
        arr[0] = arr[1]!!;
        arr[1] = tmp;
    }
};

export const unescapeTinyString = (value: string): string => {
    return value
        .replace(/\\\\/g, "\\")
        .replace(/\\n/g, "\n")
        .replace(/\\r/g, "\r")
        .replace(/\\t/g, "\t")
        .replace(/\\0/g, "\0");
};

export const tiny2Exception = (line: number, data: string): Error => {
    return new Error(`Invalid Tiny v2 line: #${line}: ${data}`);
};

export const putOrGetClass = (
  names: string | string[],
  classes: Map<string, ClassMapping>,
  classMappings?: ClassMapping[]
): ClassMapping => {
  const [obfName, deobfName] = typeof names === 'string' ? [names, names] : [names[0]!, names[1] ?? names[0]!];

  if (!classes.has(obfName)) {
    const cls: ClassMapping = {
      obfuscatedName: obfName,
      deobfuscatedName: deobfName,
      fields: [],
      methods: [],
    };
    classes.set(obfName, cls);
    classMappings?.push(cls);
  }

  return classes.get(obfName)!;
};
