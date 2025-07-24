import { putOrGetClass, tiny2Exception, unescapeTinyString } from "../util";
import type {
  MappingSet,
  ClassMapping,
  MethodMapping,
  FieldMapping,
  ParameterMapping,
} from "../types";
import { AbstractMappingsParser } from "./abstract-mapping-parser";

export enum TinyV2State {
  ROOT,
  CLASS,
  FIELD,
  METHOD,
  PARAMETER,
}


/**
 * Tiny v2 parser with parameters & local variables support.
 */
export class TinyV2Parser extends AbstractMappingsParser {
  parse(content: string[]): MappingSet {
    if (content.length === 0) {
      throw new Error("Empty Tiny V2 lines");
    }

    const header = content[0]!!.split("\t");
    if (header.length < 5) {
      throw new Error("Invalid Tiny v2 Header: " + content[0]);
    }

    const major = Number(header[1]);
    const minor = Number(header[2]);
    if (major !== 2 || minor !== 0) {
      throw new Error("Unsupported Tiny v2 version: " + content[0]);
    }

    const nameCount = header.length - 3;

    const classes = new Map<string, ClassMapping>();
    const classMappings: ClassMapping[] = [];

    const properties = new Map<string, string | null>();
    let escaped = false;
    let start = 1;

    // Parse properties at the beginning (empty first column lines)
    for (; start < content.length; start++) {
      const line = content[start]!!.split("\t");
      if (line[0] !== "") break;

      const key = line[1]!!;
      const value = line.length < 3 ? null : escaped ? unescapeTinyString(line[2]!!) : line[2];
      properties.set(key, value!!);

      if (key === "escaped-names") escaped = true;
    }

    // State stacks and current elements
    const stack: TinyV2State[] = [];
    let cls: ClassMapping | null = null;
    let field: FieldMapping | null = null;
    let method: MethodMapping | null = null;
    let param: ParameterMapping | null = null;

    for (let x = start; x < content.length; x++) {
      let line = content[x]!!;

      // Count leading tabs to determine depth
      let newdepth = 0;
      while (line.charAt(newdepth) === "\t") newdepth++;
      if (newdepth !== 0) line = line.substring(newdepth);

      // Pop stack until depth matches
      while (stack.length !== newdepth) {
        const popped = stack.pop();
        switch (popped) {
          case TinyV2State.CLASS:
            cls = null;
            break;
          case TinyV2State.FIELD:
            field = null;
            break;
          case TinyV2State.METHOD:
            method = null;
            break;
          case TinyV2State.PARAMETER:
            param = null;
            break;
        }
      }

      const parts = line.split("\t");
      if (escaped) {
        for (let y = 1; y < parts.length; y++) {
          parts[y] = unescapeTinyString(parts[y]!!);
        }
      }

      switch (parts[0]) {
        case "c": // Class
          if (stack.length === 0) {
            if (parts.length !== nameCount + 1) throw tiny2Exception(x, line);
            cls = putOrGetClass(parts.slice(1), classes, classMappings);
            stack.push(TinyV2State.CLASS);
          }
          break;

        case "f": // Field
          if (parts.length !== nameCount + 2 || stack[stack.length - 1] !== TinyV2State.CLASS) throw tiny2Exception(x, line);
          if (!cls) throw tiny2Exception(x, line);
          field = {
            obfuscatedName: parts[2]!!,
            deobfuscatedName: parts[3]!!,
            descriptor: parts[1],
          };
          cls.fields.push(field);
          stack.push(TinyV2State.FIELD);
          break;

        case "m": // Method
          if (parts.length !== nameCount + 2 || stack[stack.length - 1] !== TinyV2State.CLASS) throw tiny2Exception(x, line);
          if (!cls) throw tiny2Exception(x, line);
          method = {
            obfuscatedName: parts[2]!!,
            deobfuscatedName: parts[3]!!,
            descriptor: parts[1],
            parameters: [],
          };
          cls.methods.push(method);
          stack.push(TinyV2State.METHOD);
          break;

        case "p": // Parameter
          if (parts.length !== nameCount + 2 || stack[stack.length - 1] !== TinyV2State.METHOD) throw tiny2Exception(x, line);
          if (!method) throw tiny2Exception(x, line);
          const index = Number(parts[1]);
          const paramNames = parts.slice(2);
          param = {
            index,
            obfuscatedName: paramNames[0] ?? "",
            deobfuscatedName: paramNames[1] ?? paramNames[0] ?? "",
          };
          method.parameters?.push(param);
          stack.push(TinyV2State.PARAMETER);
          break;

        case "v": // Local variable (ignored)
          break;

        default:
          throw tiny2Exception(x, line);
      }
    }

    return { classes: classMappings };
  }
}
