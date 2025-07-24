import { putOrGetClass, rsplit } from "../util";
import type {
  MappingSet,
  ClassMapping,
  FieldMapping,
  MethodMapping,
} from "../types";
import { AbstractMappingsParser } from "./abstract-mapping-parser";

/**
 * SRG/XSRG parser.
 * Does NOT support parameters or local variables (not in SRG).
 */
export class SRGXSRGParser extends AbstractMappingsParser {
  parse(content: string[]): MappingSet {
    const classes: Map<string, ClassMapping> = new Map();

    for (const line of content) {
      const pts = line.split(" ");
      switch (pts[0]) {
        case "PK:":
          // Package mapping ignored
          break;
        case "CL:": {
          const obf = pts[1];
          const deobf = pts[2];
          classes.set(obf!!, {
            obfuscatedName: obf!!,
            deobfuscatedName: deobf!!,
            fields: [],
            methods: [],
          });
          break;
        }
        case "FD:": {
          if (pts.length === 5) {
            // XSRG format: FD: OrigClass/OrigField OrigDesc NewClass/NewField NewDesc
            const [leftClass, leftField] = rsplit(pts[1], "/", 1);
            const [_, rightField] = rsplit(pts[3], "/", 1);
            const clazz = putOrGetClass(leftClass!!, classes);
            const field: FieldMapping = {
              obfuscatedName: leftField!!,
              deobfuscatedName: rightField!!,
              descriptor: pts[2],
            };
            clazz.fields.push(field);
          } else {
            // SRG format: FD: OrigClass/OrigField NewClass/NewField
            const [leftClass, leftField] = rsplit(pts[1], "/", 1);
            const [_, rightField] = rsplit(pts[2], "/", 1);
            const clazz = putOrGetClass(leftClass!!, classes);
            const field: FieldMapping = {
              obfuscatedName: leftField!!,
              deobfuscatedName: rightField!!,
            };
            clazz.fields.push(field);
          }
          break;
        }
        case "MD:": {
          // MD: OrigClass/OrigMethod OrigDesc NewClass/NewMethod NewDesc
          const [leftClass, leftMethod] = rsplit(pts[1], "/", 1);
          const [_, rightMethod] = rsplit(pts[3], "/", 1);
          const clazz = putOrGetClass(leftClass!!, classes);
          const method: MethodMapping = {
            obfuscatedName: leftMethod!!,
            deobfuscatedName: rightMethod!!,
            descriptor: pts[2],
          };
          clazz.methods.push(method);
          break;
        }
        default:
          throw new Error("Invalid SRG file, Unknown type: " + line);
      }
    }

    return {
      classes: Array.from(classes.values()),
    };
  }
}
