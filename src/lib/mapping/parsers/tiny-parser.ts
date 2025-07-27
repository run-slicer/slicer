import type { ClassMapping, MappingSet } from "java-remapper";
import { putOrGetClass } from "../util";
import { AbstractMappingsParser } from "./abstract-mapping-parser";

/**
 * Tiny v1 parser.
 * Limited support, no parameters or locals.
 * Only basic classes, fields, methods.
 */
export class TinyParser extends AbstractMappingsParser {
    parse(content: string[]): MappingSet {
        if (content.length === 0) {
            throw new Error("Empty Tiny V1 lines");
        }

        const header = content[0]!!.split("\t");
        if (header.length < 3) {
            throw new Error("Invalid Tiny v1 Header: " + content[0]);
        }

        const nameCount = header.length - 1;

        // Map of obfuscated class name -> ClassMapping
        const classes = new Map<string, ClassMapping>();

        const classMappings: ClassMapping[] = [];

        function duplicate(value: string, count: number): string[] {
            return Array(count).fill(value);
        }

        for (let i = 1; i < content.length; i++) {
            const line = content[i]!!.split("\t");
            if (line[0]!!.startsWith("#")) {
                // Comment line, skip
                continue;
            }

            switch (line[0]) {
                case "CLASS":
                    if (line.length !== nameCount + 1) {
                        throw new Error(`Invalid Tiny v1 line #${i}: ${content[i]}`);
                    }
                    putOrGetClass(line.slice(1), classes, classMappings);
                    break;

                case "FIELD":
                    if (line.length !== nameCount + 3) {
                        throw new Error(`Invalid Tiny v1 line #${i}: ${content[i]}`);
                    }
                    {
                        const cls =
                            classes.get(line[1]!!) ??
                            putOrGetClass(duplicate(line[1]!!, nameCount), classes, classMappings);
                        cls.fields.push({
                            obfuscatedName: line[3]!!,
                            deobfuscatedName: line[4] ?? line[3]!!,
                            descriptor: line[2],
                        });
                    }
                    break;

                case "METHOD":
                    if (line.length !== nameCount + 3) {
                        throw new Error(`Invalid Tiny v1 line #${i}: ${content[i]!!}`);
                    }
                    {
                        const cls =
                            classes.get(line[1]!!) ??
                            putOrGetClass(duplicate(line[1]!!, nameCount), classes, classMappings);
                        cls.methods.push({
                            descriptor: line[2],
                            obfuscatedName: line[3]!!,
                            deobfuscatedName: line[4] ?? line[3]!!,
                        });
                    }
                    break;

                default:
                    throw new Error(`Invalid Tiny v1 line #${i}: ${content[i]}`);
            }
        }

        return {
            classes: classMappings,
        };
    }
}
