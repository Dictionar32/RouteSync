/**
 * Expression.ts
 * Expression and constant value types
 */
import { FileSpan } from "../types/FileSpan";
import type { SemanticType } from "../types";

export interface SymbolReference {
  readonly symbolId: number;
  readonly span: FileSpan;
}

export class ArrayConstant {
    readonly kind = 'ArrayConstant';
    constructor(readonly elements: readonly ConstantValue[]) { }
}

export class ClassConstant {
    readonly kind = 'ClassConstant';
    constructor(readonly namespace: string, readonly className: string) {}
}

export class EnumCase {
    readonly kind = 'EnumCase';
    constructor(readonly enumName: string, readonly caseName: string) {}
}

export type ConstantValue =
    | string
    | number
    | boolean
    | null
    | ArrayConstant
    | ClassConstant
    | EnumCase
    | SymbolReference;

export type Expression =
    | { kind: 'Literal'; value: ConstantValue }
    | { kind: 'Call'; callee: string; readonly arguments: readonly Expression[] }
    | { kind: 'PropertyAccess'; target: Expression; property: string }
    | { kind: 'MethodCall'; target: Expression; method: string; readonly arguments: readonly Expression[] };

export interface SemanticValue {
    readonly type: SemanticType;
    readonly constantValue?: ConstantValue;
}