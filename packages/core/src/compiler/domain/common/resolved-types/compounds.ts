/** Relation-backed compound resolved semantic types. */
import { SemanticValueFactory } from '../../../../types/domain/semanticValues';
import type { ResolvedSemanticType } from './catamorphism';
import type {
    ResolvedObjectTypeParams, ResolvedUnionTypeParams, ResolvedIntersectionTypeParams,
    ResolvedUnknownTypeParams, ObjectKind, ResolvedProperty, ResolvedObjectIdentity
} from './types';
import { relationResolve } from '../../../../semantic/kernel/relationalSequence';
import type { ResolvedSemanticTypeBase } from './base';

export interface ResolvedObjectType extends ResolvedSemanticTypeBase {
    readonly kind: 'object';
    readonly fields: readonly ResolvedProperty[];
    readonly identity: ResolvedObjectIdentity;
}

export const ResolvedObjectType = Object.freeze({
    create: (params: ResolvedObjectTypeParams): ResolvedObjectType => {
        const witness: ResolvedObjectType = {
            kind: 'object' as const,
            fields: Object.freeze([...params.fields]),
            identity: Object.freeze({ ...params.identity }),
            formatProperty: (name: string, lower: (t: ResolvedSemanticType) => string) => `${name}: ${lower(witness)};`,
            formatMapperAssignment: (name: string) => `  ${name}: api.${name},`,
            formatChildArrayMapper: (name: string) => `  ${name}: api.${name},`,
        } satisfies ResolvedObjectType;
        return Object.freeze(witness);
    },
    plain: (fields: readonly ResolvedProperty[] = []): ResolvedObjectType => ResolvedObjectType.create({
        fields,
        identity: { kind: 'plain', name: SemanticValueFactory.domainName('Object') },
    }),
    named: (kind: Exclude<ObjectKind, 'plain'>, name: string, fields: readonly ResolvedProperty[] = []): ResolvedObjectType => {
        const identity = relationResolve(
            Object.is(kind, 'resource'),
            () => ({ kind: 'resource' as const, name: SemanticValueFactory.resourceName(name) }),
            () => relationResolve(
                Object.is(kind, 'model'),
                () => ({ kind: 'model' as const, name: SemanticValueFactory.modelName(name) }),
                () => ({ kind: 'response' as const, name: SemanticValueFactory.responseTypeName(name) }),
            ),
        );
        return ResolvedObjectType.create({ fields, identity });
    },
});

export interface ResolvedUnionType extends ResolvedSemanticTypeBase {
    readonly kind: 'union';
    readonly members: readonly ResolvedSemanticType[];
}
export const ResolvedUnionType = Object.freeze({
    create: ({ members }: ResolvedUnionTypeParams): ResolvedUnionType => {
        const witness: ResolvedUnionType = {
            kind: 'union' as const, members: Object.freeze([...members]),
            formatProperty: (name: string, lower: (t: ResolvedSemanticType) => string) => `${name}: ${lower(witness)};`,
            formatMapperAssignment: (name: string) => `  ${name}: api.${name},`,
            formatChildArrayMapper: (name: string) => `  ${name}: api.${name},`,
        } satisfies ResolvedUnionType;
        return Object.freeze(witness);
    },
    of: (members: readonly ResolvedSemanticType[]): ResolvedUnionType => ResolvedUnionType.create({ members }),
});

export interface ResolvedIntersectionType extends ResolvedSemanticTypeBase {
    readonly kind: 'intersection';
    readonly members: readonly ResolvedSemanticType[];
}
export const ResolvedIntersectionType = Object.freeze({
    create: ({ members }: ResolvedIntersectionTypeParams): ResolvedIntersectionType => {
        const witness: ResolvedIntersectionType = {
            kind: 'intersection' as const, members: Object.freeze([...members]),
            formatProperty: (name: string, lower: (t: ResolvedSemanticType) => string) => `${name}: ${lower(witness)};`,
            formatMapperAssignment: (name: string) => `  ${name}: api.${name},`,
            formatChildArrayMapper: (name: string) => `  ${name}: api.${name},`,
        } satisfies ResolvedIntersectionType;
        return Object.freeze(witness);
    },
    of: (members: readonly ResolvedSemanticType[]): ResolvedIntersectionType => ResolvedIntersectionType.create({ members }),
});

export interface ResolvedUnknownType extends ResolvedSemanticTypeBase {
    readonly kind: 'unknown';
    readonly diagnosticMessage: string;
}
export const ResolvedUnknownType = Object.freeze({
    create: ({ diagnosticMessage }: ResolvedUnknownTypeParams): ResolvedUnknownType => {
        const witness: ResolvedUnknownType = {
            kind: 'unknown' as const, diagnosticMessage,
            formatProperty: (name: string, lower: (t: ResolvedSemanticType) => string) => `${name}: ${lower(witness)};`,
            formatMapperAssignment: (name: string) => `  ${name}: api.${name},`,
            formatChildArrayMapper: (name: string) => `  ${name}: api.${name},`,
        } satisfies ResolvedUnknownType;
        return Object.freeze(witness);
    },
    withMessage: (diagnosticMessage: string): ResolvedUnknownType => ResolvedUnknownType.create({ diagnosticMessage }),
});
