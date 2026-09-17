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
import type { SemanticTypeHandler, SemanticTypeResolverLike } from './resolverContracts';

export class NullableWrapperHandler implements SemanticTypeHandler {
    supports(type: SemanticType): boolean {
        return type.kind === 'nullable';
    }

    resolve(type: SemanticType, resolver: SemanticTypeResolverLike): ResolvedSemanticType {
        if (type.kind !== 'nullable') {
            return resolver.resolve(type);
        }
        return new ResolvedNullableType({ innerType: resolver.resolve(type.innerType) });
    }
}

export class DefaultObjectHandler implements SemanticTypeHandler {
    supports(type: SemanticType): boolean {
        return type.kind === 'object';
    }

    resolve(type: SemanticType, resolver: SemanticTypeResolverLike): ResolvedSemanticType {
        if (type.kind !== 'object') {
            return resolver.resolve(type);
        }

        const fields: readonly ResolvedProperty[] = type.properties
            .filter(property => !property.name.startsWith('__'))
            .map(property => ({
                name: property.name,
                type: resolver.resolve(property.type),
                presence: property.required ? 'required' : 'optional'
            }));

        const identity = type.role === 'plain'
            ? { kind: 'plain' as const, name: type.name }
            : { kind: type.role, name: type.name };

        return new ResolvedObjectType({ fields, identity });
    }
}

export class UnionTypeHandler implements SemanticTypeHandler {
    supports(type: SemanticType): boolean {
        return type.kind === 'union';
    }

    resolve(type: SemanticType, resolver: SemanticTypeResolverLike): ResolvedSemanticType {
        const u = type as UnionType;
        const members = Array.from(u.members.values()).map((m: SemanticType) => resolver.resolve(m));
        return new ResolvedUnionType({ members });
    }
}

export class IntersectionTypeHandler implements SemanticTypeHandler {
    supports(type: SemanticType): boolean {
        return type.kind === 'intersection';
    }

    resolve(type: SemanticType, resolver: SemanticTypeResolverLike): ResolvedSemanticType {
        const i = type as IntersectionType;
        const members = Array.from(i.members.values()).map((m: SemanticType) => resolver.resolve(m));
        return new ResolvedIntersectionType({ members });
    }
}
