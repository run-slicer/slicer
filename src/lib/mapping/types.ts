export interface MappingSet {
  classes: ClassMapping[];
}

export interface ClassMapping {
  obfuscatedName: string;
  deobfuscatedName: string;
  fields: FieldMapping[];
  methods: MethodMapping[];
}

export interface FieldMapping {
  obfuscatedName: string;
  deobfuscatedName: string;
  descriptor?: string;
}

export interface MethodMapping {
  obfuscatedName: string;
  deobfuscatedName: string;
  descriptor?: string;
  parameters?: ParameterMapping[];
}

export interface ParameterMapping {
  index: number;
  obfuscatedName: string;
  deobfuscatedName: string;
}