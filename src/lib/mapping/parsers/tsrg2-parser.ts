import type { ClassMapping, MappingSet, MethodMapping } from "java-remapper";
import { putOrGetClass, swapFirst } from "../util";
import { AbstractMappingsParser } from "./abstract-mapping-parser";

/**
 * Parses TSRG2 format mappings.
 */
export class TSRG2Parser extends AbstractMappingsParser {
    parse(content: string[]): MappingSet {
        if (content.length === 0) {
            throw new Error("Empty TSRG2 lines");
        }

        const header = content[0]!!.split(" ");
        if (header.length < 3) {
            throw new Error("Invalid TSRG v2 Header: " + content[0]);
        }
        const nameCount = header.length - 1; // number of names per line after first

        // The first line lists the "name keys" like ["left", "right", "intermediary"]
        // We won't use those names explicitly here, but we parse lines accordingly
        content = content.slice(1);

        // Internal structures to hold mappings
        const classes: Map<string, ClassMapping> = new Map();

        let currentClass: ClassMapping | null = null;
        let currentMethod: MethodMapping | null = null;

        for (const line of content) {
            if (line.length < 2) {
                throw new Error("Invalid TSRG v2 line, too short: " + line);
            }

            const pts = line.split(" ");

            if (line.charAt(0) !== "\t") {
                // Classes or Packages are not tabbed
                if (pts.length !== nameCount) {
                    throw new Error("Invalid TSRG v2 line: " + line);
                }

                // Class line: add class mapping
                currentClass = putOrGetClass(pts, classes);
                currentMethod = null;
            } else if (line.charAt(1) === "\t") {
                // Parameter or static marker line, two tabs at start
                if (currentMethod === null) {
                    throw new Error("Invalid TSRG v2 line, missing method: " + line);
                }
                // Strip two tabs from start
                pts[0] = pts[0]!!.substring(2);

                if (pts.length === nameCount + 1) {
                    // Parameter line: first is index, rest are names
                    const paramIndex = parseInt(pts[0], 10);
                    if (isNaN(paramIndex)) {
                        throw new Error("Invalid TSRG v2 parameter index: " + pts[0]);
                    }
                    const paramNames = pts.slice(1);
                    if (!currentMethod.parameters) currentMethod.parameters = [];
                    currentMethod.parameters.push({
                        index: paramIndex,
                        obfuscatedName: paramNames[0]!!,
                        deobfuscatedName: (paramNames[1] ?? paramNames[0])!!,
                    });
                } else {
                    throw new Error("Invalid TSRG v2 line, too many parts: " + line);
                }
            } else {
                // One tab at start: field or method line
                if (currentClass === null) {
                    throw new Error("Invalid TSRG v2 line, missing class: " + line);
                }
                // Strip one tab
                pts[0] = pts[0]!!.substring(1);

                if (pts.length === nameCount) {
                    // Field without descriptor
                    currentClass.fields.push({
                        obfuscatedName: pts[0],
                        deobfuscatedName: pts[1] ?? pts[0],
                    });
                    currentMethod = null;
                } else if (pts.length === 1 + nameCount) {
                    // Field with descriptor or method
                    swapFirst(pts);
                    if (pts[0].startsWith("(")) {
                        // Method line: pts[0] = descriptor, rest = names
                        currentMethod = {
                            descriptor: pts[0],
                            obfuscatedName: pts[1]!!,
                            deobfuscatedName: pts[2] ?? pts[1]!!,
                        };
                        currentClass.methods.push(currentMethod);
                    } else {
                        // Field with descriptor
                        currentMethod = null;
                        currentClass.fields.push({
                            obfuscatedName: pts[1]!!,
                            deobfuscatedName: pts[2] ?? pts[1]!!,
                            descriptor: pts[0],
                        });
                    }
                } else {
                    throw new Error("Invalid TSRG v2 line, too many parts: " + line);
                }
            }
        }

        return {
            classes: Array.from(classes.values()),
        };
    }
}
