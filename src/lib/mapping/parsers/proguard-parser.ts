import { toDesc } from "../util";
import type {
  MappingSet,
  ClassMapping,
  FieldMapping,
  MethodMapping,
} from "../types";
import { AbstractMappingsParser } from "./abstract-mapping-parser";

/**
 * ProGuard parser.
 * Does NOT support parameter or local variable names.
 */
export class ProguardParser extends AbstractMappingsParser {
  parse(content: string[]): MappingSet {
    const classes: Map<string, ClassMapping> = new Map();

    

    let currentClass: ClassMapping | null = null;

    for (let line of content) {

      if (!line.startsWith("    ") && line.endsWith(":")) {
        // Class declaration line
        // e.g. some/package/ClassName -> new/package/NewClassName:
        const parts = line.split(" -> ");
        if (parts.length !== 2)
          throw new Error("Invalid Proguard class line: " + line);

        const deobfName = parts[0];
        const obfName = parts[1]!!.slice(0, -1); // remove trailing ':'

        currentClass = {
          obfuscatedName: obfName!!,
          deobfuscatedName: deobfName!!,
          fields: [],
          methods: [],
        };
        classes.set(obfName!!, currentClass);
      } else if (line.includes("(") && line.includes(")")) {
        // Method line
        if (!currentClass)
          throw new Error("Invalid Proguard line, missing class: " + line);

        line = line.trim();

        let startLine = 0;
        let endLine = 0;

        // Check if line has line number ranges like: 10:15 returnType methodName(...)
        if (line.indexOf(":") !== -1) {
          const firstColon = line.indexOf(":");
          const secondColon = line.indexOf(":", firstColon + 1);
          if (secondColon !== -1) {
            startLine = parseInt(line.substring(0, firstColon));
            endLine = parseInt(line.substring(firstColon + 1, secondColon));
            line = line.substring(secondColon + 1).trim();
          }
        }

        // Split into parts around " -> "
        const arrowIndex = line.indexOf(" -> ");
        if (arrowIndex === -1)
          throw new Error("Invalid Proguard method line (missing ->): " + line);

        const obfName = line.substring(arrowIndex + 4).trim();

        // Extract return type, method name and args
        const retTypeAndName = line.substring(0, arrowIndex).trim();
        // retType is the first word before space
        const firstSpaceIdx = retTypeAndName.indexOf(" ");
        if (firstSpaceIdx === -1)
          throw new Error("Invalid Proguard method line (no space): " + line);

        const retType = retTypeAndName.substring(0, firstSpaceIdx).trim();
        const rest = retTypeAndName.substring(firstSpaceIdx + 1).trim();

        // The method name is from after return type up to '('
        const parenStart = rest.indexOf("(");
        if (parenStart === -1)
          throw new Error("Invalid Proguard method line (no '('): " + line);

        const methodName = rest.substring(0, parenStart).trim();

        // Parse args inside parentheses
        const argsStr = rest.substring(parenStart + 1, rest.indexOf(")"));
        const args = argsStr.length > 0 ? argsStr.split(",").map((a) => a.trim()) : [];

        // Build method descriptor string
        let desc = "(";
        for (const arg of args) {
          if (arg.length === 0) break;
          desc += toDesc(arg);
        }
        desc += ")" + toDesc(retType);

        const method: MethodMapping = {
          obfuscatedName: obfName,
          deobfuscatedName: methodName,
          descriptor: desc,
        };
        
        currentClass.methods.push(method);
      } else {
        // Field line
        if (!currentClass)
          throw new Error("Invalid Proguard line, missing class: " + line);

        // e.g. int oldField -> newField
        const parts = line.trim().split(" ");
        if (parts.length < 4 || parts[2] !== "->")
          throw new Error("Invalid Proguard field line: " + line);

        const field: FieldMapping = {
          obfuscatedName: parts[3]!!,
          deobfuscatedName: parts[1]!!,
          descriptor: toDesc(parts[0]!!),
        };
        currentClass.fields.push(field);
      }
    }

    return {
      classes: Array.from(classes.values()),
    };
  }

}
