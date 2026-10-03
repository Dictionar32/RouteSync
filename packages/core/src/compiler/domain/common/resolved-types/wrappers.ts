/** Relation-backed wrapper resolved semantic types. */
import type { ResolvedSemanticType } from './catamorphism';
import type { ResolvedSemanticTypeBase } from './base';
import type { ResolvedReferenceTypeParams, ResolvedOptionalTypeParams, ResolvedNullableTypeParams, ResolvedCollectionTypeParams } from './types';

export interface ResolvedReferenceType extends ResolvedSemanticTypeBase {
    readonly kind: 'reference';
    readonly name: string;
    readonly namespace: string;
}
export const ResolvedReferenceType = Object.freeze({
    create: ({ name, namespace }: ResolvedReferenceTypeParams): ResolvedReferenceType => {
        const witness: ResolvedReferenceType = {
            kind: 'reference' as const, name, namespace,
            formatChildArrayMapper: (field: string) => {
                const childResource = name.replace(/(Transformed|ApiResponse)$/, '');
                return `  ${field}: api.${field}?.map(to${childResource}Read),`;
            },
            formatProperty: (field: string, lower: (t: ResolvedSemanticType) => string) => `${field}: ${lower(witness)};`,
            formatMapperAssignment: (field: string) => `  ${field}: api.${field},`,
        } satisfies ResolvedReferenceType;
        return Object.freeze(witness);
    },
    named: (name: string, namespace: string): ResolvedReferenceType => ResolvedReferenceType.create({ name, namespace }),
});

export interface ResolvedOptionalType extends ResolvedSemanticTypeBase {
    readonly kind: 'optional';
    readonly innerType: ResolvedSemanticType;
}
export const ResolvedOptionalType = Object.freeze({
    create: ({ innerType }: ResolvedOptionalTypeParams): ResolvedOptionalType => {
        const witness: ResolvedOptionalType = {
            kind: 'optional' as const, innerType,
            formatProperty: (name: string, lower: (t: ResolvedSemanticType) => string) => `${name}?: ${lower(innerType)};`,
            formatMapperAssignment: (name: string) => `  ${name}: api.${name},`,
            formatChildArrayMapper: (name: string) => `  ${name}: api.${name},`,
        } satisfies ResolvedOptionalType;
        return Object.freeze(witness);
    },
    of: (innerType: ResolvedSemanticType): ResolvedOptionalType => ResolvedOptionalType.create({ innerType }),
});

export interface ResolvedNullableType extends ResolvedSemanticTypeBase {
    readonly kind: 'nullable';
    readonly innerType: ResolvedSemanticType;
}
export const ResolvedNullableType = Object.freeze({
    create: ({ innerType }: ResolvedNullableTypeParams): ResolvedNullableType => {
        const witness: ResolvedNullableType = {
            kind: 'nullable' as const, innerType,
            formatProperty: (name: string, lower: (t: ResolvedSemanticType) => string) => `${name}: ${lower(witness)};`,
            formatMapperAssignment: (name: string) => `  ${name}: api.${name},`,
            formatChildArrayMapper: (name: string) => `  ${name}: api.${name},`,
        } satisfies ResolvedNullableType;
        return Object.freeze(witness);
    },
    of: (innerType: ResolvedSemanticType): ResolvedNullableType => ResolvedNullableType.create({ innerType }),
});

export interface ResolvedCollectionType extends ResolvedSemanticTypeBase {
    readonly kind: 'collection';
    readonly elementType: ResolvedSemanticType;
}
export const ResolvedCollectionType = Object.freeze({
    create: ({ elementType }: ResolvedCollectionTypeParams): ResolvedCollectionType => {
        const witness: ResolvedCollectionType = {
            kind: 'collection' as const, elementType,
            formatProperty: (name: string, lower: (t: ResolvedSemanticType) => string) => `${name}: ${lower(witness)};`,
            formatMapperAssignment: (name: string) => elementType.formatChildArrayMapper(name),
            formatChildArrayMapper: (name: string) => `  ${name}: api.${name},`,
        } satisfies ResolvedCollectionType;
        return Object.freeze(witness);
    },
    of: (elementType: ResolvedSemanticType): ResolvedCollectionType => ResolvedCollectionType.create({ elementType }),
});
