import { CSRGTSRGParser, ProguardParser, SRGXSRGParser, TinyParser, TinyV2Parser, TSRG2Parser } from "./parsers";
import type { MappingSet } from "java-remapper";
import { stripComment } from "./util";

export enum MappingFormat {
    SRG_XSRG = "SRG_XSRG",
    CSRG_TSRG = "CSRG_TSRG",
    TSRG2 = "TSRG2",
    PG = "PG",
    TINY1 = "TINY1",
    TINY2 = "TINY2",
}

export function parseMappings(format: MappingFormat, content: string): MappingSet {
    const linesRaw = content.split(/\r?\n/);
    const lines = linesRaw.filter((l) => l.trim().length > 0);

    if (lines.length === 0) {
        return { classes: [] };
    }

    // Find first non-empty non-comment line
    let firstLine = "";
    for (const l of lines) {
        const stripped = stripComment(l);
        if (stripped.length > 0) {
            firstLine = stripped;
            break;
        }
    }

    // Use filters to clean lines for some loaders
    const filtered = lines.map(stripComment).filter((l) => l.length > 0);

    switch (format) {
        case MappingFormat.SRG_XSRG:
            return new SRGXSRGParser().parse(filtered);
        case MappingFormat.CSRG_TSRG:
            return new CSRGTSRGParser().parse(filtered);
        case MappingFormat.TSRG2:
            return new TSRG2Parser().parse(filtered);
        case MappingFormat.PG:
            return new ProguardParser().parse(filtered);
        case MappingFormat.TINY1:
            return new TinyParser().parse(filtered);
        case MappingFormat.TINY2:
            return new TinyV2Parser().parse(filtered);
        default:
            throw new Error(`Unknown mapping format: ${format}`);
    }
}

/**
 * Detects the mapping format of a Java mapping file based on its header and content.
 */
export function detectMappingFormat(content: string): MappingFormat | null {
    const lines = content.split(/\r?\n/);
    if (lines.length === 0) return null;

    // Skip empty and comment-only lines
    let i = 0;
    let firstLine = lines[i] ?? "";
    while (i < lines.length && stripComment(firstLine).length === 0) {
        i++;
        firstLine = lines[i] ?? "";
    }

    const test = firstLine.split(" ")[0]!!;

    if (["PK:", "CL:", "FD:", "MD:"].includes(test)) return MappingFormat.SRG_XSRG;
    if (firstLine.includes(" -> ")) return MappingFormat.PG;
    if (firstLine.startsWith("v1\t")) return MappingFormat.TINY1;
    if (firstLine.startsWith("tiny\t")) return MappingFormat.TINY2;
    if (firstLine.startsWith("tsrg2 ")) return MappingFormat.TSRG2;

    // Check if it follows CSRG/TSRG style structure
    const nonCommentLines = lines.map(stripComment).filter((l) => l.trim().length > 0);

    if (
        nonCommentLines.length > 0 &&
        nonCommentLines.every((line) => {
            const parts = line.trim().split(/\s+/);

            return (
                parts.length === 2 || // class rename
                parts.length === 3 || // field rename
                (parts.length === 4 && /^\(.*\).*$/.test(parts[2]!!)) // method with descriptor
            );
        })
    ) {
        return MappingFormat.CSRG_TSRG;
    }

    // Default fallback to old TSRG/CSRG
    return null;
}
