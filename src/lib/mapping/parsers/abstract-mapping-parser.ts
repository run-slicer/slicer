import type { MappingSet } from "java-remapper";

export abstract class AbstractMappingsParser {
    abstract parse(content: string[]): MappingSet;
}
