import { AbstractMappingsParser } from "./abstract-mapping-parser";
import type { MappingSet, ClassMapping, FieldMapping, MethodMapping } from "java-remapper";

/**
 * Parses CSRG format mappings.
 */
export class CSRGTSRGParser extends AbstractMappingsParser {
  parse(content: string[]): MappingSet {
    const classes: Map<string, ClassMapping> = new Map();

    // First pass: packages and classes (lines without leading tab)
    for (const l of content.filter((l) => !l.startsWith("\t"))) {
      const pts = l.split(" ");
      if (pts.length !== 2) continue;
      if (pts[0]!!.endsWith("/")) {
        // package line, ignoring
        continue;
      } else {
        classes.set(pts[0]!!, {
          obfuscatedName: pts[0]!!,
          deobfuscatedName: pts[1]!!,
          fields: [],
          methods: [],
        });
      }
    }

    let currentClass: ClassMapping | null = null;

    for (const line of content) {
      const pts = line.split(" ");

      if (line.startsWith("\t")) {
        if (!currentClass)
          throw new Error("Invalid TSRG line, missing class: " + line);
        // Remove leading tab from first part
        pts[0] = pts[0]!!.substring(1);
        if (pts.length === 2) {
          // field mapping
          const field: FieldMapping = {
            obfuscatedName: pts[0],
            deobfuscatedName: pts[1]!!,
          };
          currentClass.fields.push(field);
        } else if (pts.length === 3) {
          // method mapping
          const method: MethodMapping = {
            obfuscatedName: pts[0]!!,
            deobfuscatedName: pts[2]!!,
            descriptor: pts[1],
          };
          currentClass.methods.push(method);
        } else {
          throw new Error("Invalid TSRG line, too many parts: " + line);
        }
      } else {
        if (pts.length === 2) {
          if (!pts[0]!!.endsWith("/")) {
            currentClass = classes.get(pts[0]!!) || null;
          }
        } else if (pts.length === 3) {
          // field on class
          const clazz = classes.get(pts[0]!!) ?? {
            obfuscatedName: pts[0]!!,
            deobfuscatedName: pts[0]!!,
            fields: [],
            methods: [],
          };
          if (!classes.has(pts[0]!!)) classes.set(pts[0]!!, clazz);
          const field: FieldMapping = {
            obfuscatedName: pts[1]!!,
            deobfuscatedName: pts[2]!!,
          };
          clazz.fields.push(field);
        } else if (pts.length === 4) {
          // method on class
          const clazz = classes.get(pts[0]!!) ?? {
            obfuscatedName: pts[0]!!,
            deobfuscatedName: pts[0]!!,
            fields: [],
            methods: [],
          };
          if (!classes.has(pts[0]!!)) classes.set(pts[0]!!, clazz);
          const method: MethodMapping = {
            obfuscatedName: pts[2]!!,
            deobfuscatedName: pts[3]!!,
            descriptor: pts[1],
          };
          clazz.methods.push(method);
        } else {
          throw new Error("Invalid CSRG line, too many parts: " + line);
        }
      }
    }

    return {
      classes: Array.from(classes.values()),
    };
  }
}