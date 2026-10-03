/**
 * Relation-backed resolved semantic type terminal algebra.
 *
 * Construction is data-oriented: no constructor authority lives in the
 * semantic type layer. Factories below materialize immutable witnesses.
 */
import type { ResolvedSemanticType } from './catamorphism';
import type { ResolvedPrimitiveKind, ResolvedPrimitiveTypeParams } from './types';

export interface ResolvedSemanticTypeBase {
    readonly kind: string;
    readonly formatProperty: (name: string, lower: (t: ResolvedSemanticType) => string) => string;
    readonly formatMapperAssignment: (name: string) => string;
    readonly formatChildArrayMapper: (name: string) => string;
}

const formatProperty = (type: ResolvedSemanticType, name: string, lower: (t: ResolvedSemanticType) => string): string =>
    `${name}: ${lower(type)};`;

const formatMapperAssignment = (_type: ResolvedSemanticType, name: string): string =>
    `  ${name}: api.${name},`;

const formatChildArrayMapper = (_type: ResolvedSemanticType, name: string): string =>
    `  ${name}: api.${name},`;

export interface ResolvedPrimitiveType extends ResolvedSemanticTypeBase {
    readonly kind: 'primitive';
    readonly primitiveKind: ResolvedPrimitiveKind;
}

export const ResolvedPrimitiveType = Object.freeze({
    create: ({ primitiveKind }: ResolvedPrimitiveTypeParams): ResolvedPrimitiveType => {
        const witness: ResolvedPrimitiveType = {
            kind: 'primitive' as const,
            primitiveKind,
            formatProperty: (name: string, lower: (t: ResolvedSemanticType) => string) => formatProperty(witness, name, lower),
            formatMapperAssignment: (name: string) => formatMapperAssignment(witness, name),
            formatChildArrayMapper: (name: string) => formatChildArrayMapper(witness, name),
        } satisfies ResolvedPrimitiveType;
        return Object.freeze(witness);
    },
    string: (): ResolvedPrimitiveType => ResolvedPrimitiveType.create({ primitiveKind: 'string' }),
    number: (): ResolvedPrimitiveType => ResolvedPrimitiveType.create({ primitiveKind: 'number' }),
    boolean: (): ResolvedPrimitiveType => ResolvedPrimitiveType.create({ primitiveKind: 'boolean' }),
    datetime: (): ResolvedPrimitiveType => ResolvedPrimitiveType.create({ primitiveKind: 'datetime' }),
    file: (): ResolvedPrimitiveType => ResolvedPrimitiveType.create({ primitiveKind: 'file' }),
    unknown: (): ResolvedPrimitiveType => ResolvedPrimitiveType.create({ primitiveKind: 'unknown' }),
});
