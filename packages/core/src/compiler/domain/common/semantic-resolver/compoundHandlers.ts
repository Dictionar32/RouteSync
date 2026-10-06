/**
 * compoundHandlers.ts
 *
 * Handlers for nullable wrapper, object, union, and intersection SemanticTypes.
 *
 * @module compiler/domain/common/semantic-resolver
 */

import {
    type SemanticType
} from '../../../../types/domain/semanticType';
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
import { relationEqual } from '../../../../semantic/foundation/semanticRelations';
import { relationProject, relationSelect, relationResolve, relationVariantFold } from '../../../../semantic/foundation/relationalSequence';

export const NullableWrapperHandler: SemanticTypeHandler = Object.freeze({
    supports: (type: SemanticType): boolean => relationEqual(type.kind, 'nullable'),
    resolve: (type: SemanticType, resolver: SemanticTypeResolverLike): ResolvedSemanticType => relationResolve(
        relationEqual(type.kind, 'nullable'),
        () => relationVariantFold(type, 'nullable', () => resolver.resolve(type), nullable => ResolvedNullableType.create({ innerType: resolver.resolve(nullable.innerType) })),
        () => resolver.resolve(type),
    ),
});

export const DefaultObjectHandler: SemanticTypeHandler = Object.freeze({
    supports: (type: SemanticType): boolean => relationEqual(type.kind, 'object'),
    resolve: (type: SemanticType, resolver: SemanticTypeResolverLike): ResolvedSemanticType => relationResolve(
        relationEqual(type.kind, 'object'),
        () => relationVariantFold(type, 'object', () => resolver.resolve(type), object => {
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
        }),
        () => resolver.resolve(type),
    ),
});

export const UnionTypeHandler: SemanticTypeHandler = Object.freeze({
    supports: (type: SemanticType): boolean => relationEqual(type.kind, 'union'),
    resolve: (type: SemanticType, resolver: SemanticTypeResolverLike): ResolvedSemanticType => relationVariantFold(
        type, 'union', () => resolver.resolve(type), union => ResolvedUnionType.create({ members: relationProject(union.members, member => resolver.resolve(member)) }),
    ),
});

export const IntersectionTypeHandler: SemanticTypeHandler = Object.freeze({
    supports: (type: SemanticType): boolean => relationEqual(type.kind, 'intersection'),
    resolve: (type: SemanticType, resolver: SemanticTypeResolverLike): ResolvedSemanticType => relationVariantFold(
        type, 'intersection', () => resolver.resolve(type), intersection => ResolvedIntersectionType.create({ members: relationProject(intersection.members, member => resolver.resolve(member)) }),
    ),
});
