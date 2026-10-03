/** Structural witnesses for the resolved PHP type algebra. */

import { PrimitiveKind, type ObjectProperty } from '../SemanticType';

export interface PrimitivePhpType {
    readonly kind: 'primitive';
    readonly primitiveKind: PrimitiveKind;
    readonly nullable: boolean;
}

export const PrimitivePhpType = Object.freeze({
    create: (primitiveKind: PrimitiveKind, nullable: boolean): PrimitivePhpType => Object.freeze({ kind: 'primitive' as const, primitiveKind, nullable }),
    string: (nullable = false): PrimitivePhpType => Object.freeze({ kind: 'primitive' as const, primitiveKind: PrimitiveKind.STRING, nullable }),
    number: (nullable = false): PrimitivePhpType => Object.freeze({ kind: 'primitive' as const, primitiveKind: PrimitiveKind.NUMBER, nullable }),
    boolean: (nullable = false): PrimitivePhpType => Object.freeze({ kind: 'primitive' as const, primitiveKind: PrimitiveKind.BOOLEAN, nullable }),
    datetime: (nullable = false): PrimitivePhpType => Object.freeze({ kind: 'primitive' as const, primitiveKind: PrimitiveKind.DATETIME, nullable }),
});

export interface EloquentModelPhpType {
    readonly kind: 'model';
    readonly modelName: string;
    readonly baseName: string;
    readonly properties: readonly ObjectProperty[];
    readonly nullable: boolean;
}

export const EloquentModelPhpType = Object.freeze({
    create: (params: { readonly modelName: string; readonly baseName: string; readonly properties: readonly ObjectProperty[]; readonly nullable: boolean }): EloquentModelPhpType => Object.freeze({ kind: 'model' as const, ...params }),
});

export interface ResourceWrapperPhpType {
    readonly kind: 'resource';
    readonly resourceName: string;
    readonly targetTypeName: string;
    readonly isCollection: boolean;
    readonly nullable: boolean;
}

export const ResourceWrapperPhpType = Object.freeze({
    create: (params: { readonly resourceName: string; readonly targetTypeName: string; readonly isCollection: boolean; readonly nullable: boolean }): ResourceWrapperPhpType => Object.freeze({ kind: 'resource' as const, ...params }),
});

export interface VoidPhpType { readonly kind: 'void'; }
export const VoidPhpType = Object.freeze({ create: (): VoidPhpType => Object.freeze({ kind: 'void' as const }) });

export interface UnknownPhpType {
    readonly kind: 'unknown';
    readonly rawExpression: string;
    readonly nullable: boolean;
}

export const UnknownPhpType = Object.freeze({
    create: (rawExpression: string, nullable = false): UnknownPhpType => Object.freeze({ kind: 'unknown' as const, rawExpression, nullable }),
});
