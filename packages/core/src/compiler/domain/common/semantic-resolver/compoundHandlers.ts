/**
 * compoundHandlers.ts
 *
 * Handlers for nullable wrapper, object, union, and intersection SemanticTypes.
 *
 * @module compiler/domain/common/semantic-resolver
 */

import {
    ObjectType,
    UnionType,
    IntersectionType,
    type SemanticType
} from '../../../types/SemanticType';
import {
    ResolvedNullableType,
    ResolvedObjectType,
    ResolvedUnionType,
    ResolvedIntersectionType,
    type ResolvedSemanticType,
    type ResolvedProperty
} from '../ResolvedSemanticType';
import { SemanticValueFactory } from '../../../../types/domain/semanticValues';
import type { SemanticTypeHandler, SemanticTypeResolverLike } from './resolverContracts';
import { relationEqual } from '../../../../semantic/kernel/semanticRelations';
import { relationProject, relationSelect, relationResolve } from '../../../../semantic/kernel/relationalSequence';

export const NullableWrapperHandler: SemanticTypeHandler = Object.freeze({
    supports: (type: SemanticType): boolean => relationEqual(type.kind, 'nullable'),
    resolve: (type: SemanticType, resolver: SemanticTypeResolverLike): ResolvedSemanticType => relationResolve(
        relationEqual(type.kind, 'nullable'),
        () => ResolvedNullableType.create({ innerType: resolver.resolve((type as Extract<SemanticType, { kind: 'nullable' }>).innerType) }),
        () => resolver.resolve(type),
    ),
});

export const DefaultObjectHandler: SemanticTypeHandler = Object.freeze({
    supports: (type: SemanticType): boolean => relationEqual(type.kind, 'object'),
    resolve: (type: SemanticType, resolver: SemanticTypeResolverLike): ResolvedSemanticType => relationResolve(
        relationEqual(type.kind, 'object'),
        () => {
            const object = type as Extract<SemanticType, { kind: 'object' }>;
            const visibleProperties = relationSelect(
                object.properties,
                property => relationEqual(property.name.value.value.startsWith('__'), false),
            );
            const fields: readonly ResolvedProperty[] = relationProject(visibleProperties, property => ({
                name: property.name,
                type: resolver.resolve(property.type),
                presence: relationResolve(property.type.isOptional(), () => ({ kind: 'optional' as const }), () => ({ kind: 'required' as const })),
            }));
            const identity = relationResolve(
                Object.is(object.role, 'plain'),
                () => ({ kind: 'plain' as const, name: SemanticValueFactory.domainName(object.name) }),
                () => relationResolve(
                    Object.is(object.role, 'resource'),
                    () => ({ kind: 'resource' as const, name: SemanticValueFactory.resourceName(object.name) }),
                    () => relationResolve(
                        Object.is(object.role, 'model'),
                        () => ({ kind: 'model' as const, name: SemanticValueFactory.modelName(object.name) }),
                        () => ({ kind: 'response' as const, name: SemanticValueFactory.responseTypeName(object.name) }),
                    ),
                ),
            );
            return ResolvedObjectType.create({ fields, identity });
        },
        () => resolver.resolve(type),
    ),
});

export const UnionTypeHandler: SemanticTypeHandler = Object.freeze({
    supports: (type: SemanticType): boolean => relationEqual(type.kind, 'union'),
    resolve: (type: SemanticType, resolver: SemanticTypeResolverLike): ResolvedSemanticType => {
        const u = type as UnionType;
        const members = relationProject(Array.from(u.members.values()), (member: SemanticType) => resolver.resolve(member));
        return ResolvedUnionType.create({ members });
    },
});

export const IntersectionTypeHandler: SemanticTypeHandler = Object.freeze({
    supports: (type: SemanticType): boolean => relationEqual(type.kind, 'intersection'),
    resolve: (type: SemanticType, resolver: SemanticTypeResolverLike): ResolvedSemanticType => {
        const i = type as IntersectionType;
        const members = relationProject(Array.from(i.members.values()), (member: SemanticType) => resolver.resolve(member));
        return ResolvedIntersectionType.create({ members });
    },
});
