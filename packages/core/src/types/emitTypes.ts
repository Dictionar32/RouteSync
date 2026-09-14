/**
 * emitTypes.ts
 *
 * Element-level emitter AST types with Level 7 Complete Contracts (IPS 0%).
 *
 * @module core/types
 */

export interface TSExportContract {
  readonly name: string;
  readonly type: 'named' | 'default';
}

export type TSExport = {
  name: string;
  type: 'named' | 'default';
};

export interface ImportStatementContract {
  readonly from: string;
  readonly named: readonly string[] | undefined;
  readonly default: string | undefined;
  readonly isType: boolean | undefined;
}

export type ImportStatement = {
  from: string;
  named?: string[];
  default?: string;
  isType?: boolean;
};

export interface TSInterfaceFieldContract {
  readonly name: string;
  readonly type: string;
  readonly optional: boolean | undefined;
}

export type TSInterfaceField = {
  name: string;
  type: string;
  optional?: boolean;
};

export interface TSInterfaceContract {
  readonly name: string;
  readonly fields: readonly TSInterfaceField[];
  readonly isExported: boolean | undefined;
}

export type TSInterface = {
  name: string;
  fields: TSInterfaceField[];
  isExported?: boolean;
};

export interface TSFunctionContract {
  readonly name: string;
  readonly type: 'query' | 'mutation' | 'fetcher';
  readonly key: readonly string[];
  readonly params: string;
  readonly returnType: string;
  readonly body: readonly string[];
  readonly stableId: string;
  readonly isExported: boolean | undefined;
  readonly isAsync: boolean | undefined;
}

export type TSFunction = {
  name: string;
  type: 'query' | 'mutation' | 'fetcher';
  key: string[];
  params: string;
  returnType: string;
  body: string[];
  stableId: string;
  isExported?: boolean;
  isAsync?: boolean;
};

export interface TSConstContract {
  readonly name: string;
  readonly value: readonly string[];
  readonly isExported: boolean | undefined;
  readonly isType: boolean | undefined;
  readonly typeAnnotation: string | undefined;
}

export type TSConst = {
  name: string;
  value: string[];
  isExported?: boolean;
  isType?: boolean;
  typeAnnotation?: string;
};
