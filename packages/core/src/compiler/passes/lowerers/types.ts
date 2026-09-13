/**
 * types.ts
 *
 * Output types for compiler output lowerers.
 *
 * @module compiler/passes/lowerers
 */

export interface CompilerOutput {
    readonly code: string;
    readonly imports: readonly string[];
    readonly interfaces: readonly string[];
    readonly metadata: {
        readonly typeCount: number;
        readonly interfaceCount: number;
        readonly linesOfCode: number;
        readonly warnings: readonly string[];
    };
}

export interface FormOutput {
    readonly code: string;
    readonly formTypes: readonly string[];
    readonly metadata: {
        readonly formTypeCount: number;
        readonly totalActions: number;
        readonly linesOfCode: number;
        readonly warnings: readonly string[];
    };
}

export interface ContractOutput {
    readonly code: string;
    readonly contracts: readonly string[];
    readonly metadata: {
        readonly contractCount: number;
        readonly totalActions: number;
        readonly zodSchemasCount: number;
        readonly validatorsCount: number;
        readonly linesOfCode: number;
        readonly warnings: readonly string[];
    };
}

export interface ApiFieldOutput {
    readonly code: string;
    readonly metadata: {
        readonly linesOfCode: number;
        readonly warnings: readonly string[];
    };
}

export interface MapperOutput {
    readonly code: string;
    readonly metadata: {
        readonly linesOfCode: number;
        readonly warnings: readonly string[];
    };
}
