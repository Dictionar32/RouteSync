/**
 * typeScriptMetadata.ts
 *
 * Source mapping and interface metadata for lowered TypeScript artifacts.
 *
 * @module compiler/domain/common/ts-lowerer/typeScriptMetadata
 */

export type SourceLineRange = readonly [startLine: number, endLine: number];

export const SourceLineRange = Object.freeze({
    Unmapped: Object.freeze([1, 1] as const),
    create: (start: number, end: number): SourceLineRange => Object.freeze([start, end] as const)
});

export interface GeneratedInterfaceMetadata {
    readonly name: string;
    readonly propertyCount: number;
    readonly lineRange: SourceLineRange;
}

export interface LoweredTypeDeclaration {
    readonly code: string;
    readonly metadata: GeneratedInterfaceMetadata;
}

export interface TypeScriptBuildResult {
    readonly code: string;
    readonly interfaces: readonly GeneratedInterfaceMetadata[];
}
