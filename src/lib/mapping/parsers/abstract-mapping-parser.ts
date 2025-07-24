import type { MappingSet } from "../types";

export abstract class AbstractMappingsParser {
  
    abstract parse(content: string[]): MappingSet;

}