export interface TSEmitModule {
  routeName: string;
  files: TSFileUnit[];
}

export interface TSFileUnit {
  filePath: string;
  imports: ImportStatement[];
  zodSchemas: TSConst[];
  interfaces: TSInterface[];
  functions: TSFunction[];
  exports: TSExport[];
}

export interface TSExport {
  name: string;
  type: "named" | "default";
}

export interface ImportStatement {
  from: string;
  named?: string[];
  default?: string;
  isType?: boolean;
}

export interface TSInterfaceField {
  name: string;
  type: string;
  optional?: boolean;
}

export interface TSInterface {
  name: string;
  fields: TSInterfaceField[];
  isExported?: boolean;
}

export interface TSFunction {
  name: string;
  type: "query" | "mutation" | "fetcher";
  key: string[]; // for cache stability
  params: string;
  returnType: string;
  body: string[];
  stableId: string; // prevents duplicate hook generation
  isExported?: boolean;
  isAsync?: boolean;
}

export interface TSConst {
  name: string;
  value: string[];
  isExported?: boolean;
  isType?: boolean;
  typeAnnotation?: string;
}
