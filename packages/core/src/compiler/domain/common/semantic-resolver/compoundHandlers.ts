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
    type ResolvedField,
    type ObjectKind
} from '../ResolvedSemanticType';
import type { SemanticTypeHandler, SemanticTypeResolverLike } from './resolverContracts';

export class NullableWrapperHandler implements SemanticTypeHandler {
    supports(type: SemanticType): boolean {
        switch (type.kind) {
            case 'object': {
                const obj = type as ObjectType;
                const kind = obj.annotations?.get ? obj.annotations.get('kind') : (obj as any)?.metadata?.get?.('kind');
                return kind === 'nullable_wrapper';
            }
            default:
                return false;
        }
    }

    resolve(type: SemanticType, resolver: SemanticTypeResolverLike): ResolvedSemanticType {
        const obj = type as ObjectType;
        let innerVal: SemanticType | undefined = undefined;
        if (typeof (obj.properties as any)?.get === 'function') {
            innerVal = (obj.properties as any).get('__value');
        } else if (Array.isArray(obj.properties)) {
            innerVal = (obj.properties as any[]).find(p => p.name === '__value')?.type;
        }

        switch (innerVal) {
            case undefined:
                return new ResolvedObjectType();
            default:
                return new ResolvedNullableType({ innerType: resolver.resolve(innerVal) });
        }
    }
}

export class DefaultObjectHandler implements SemanticTypeHandler {
    supports(type: SemanticType): boolean {
        return type.kind === 'object';
    }

    resolve(type: SemanticType, resolver: SemanticTypeResolverLike): ResolvedSemanticType {
        const obj = type as ObjectType;
        let rawProps: [string, SemanticType, boolean][] = [];

        if (Array.isArray((obj as any).properties)) {
            rawProps = (obj as any).properties.map((p: any) => [
                p.name,
                p.type,
                p.required !== undefined ? !p.required : (obj.requiredProperties?.has ? !obj.requiredProperties.has(p.name) : false)
            ]);
        } else if (obj.properties && typeof (obj.properties as any).entries === 'function') {
            rawProps = Array.from((obj.properties as any).entries()).map(([key, valType]: any) => [
                key,
                valType,
                obj.requiredProperties?.has ? !obj.requiredProperties.has(key) : false
            ]);
        }

        const cleanProps = rawProps.filter(([key]) => typeof key === 'string' && !key.startsWith('__'));

        const fields: readonly ResolvedField[] = cleanProps.map(([key, valType]) => {
            return [key, resolver.resolve(valType)];
        });

        const nameAnnotation = obj.annotations?.get ? (obj.annotations.get('name') ?? (obj as any).metadata?.get?.('name')) : (obj as any)?.metadata?.get?.('name');
        const kindAnnotation = obj.annotations?.get ? (obj.annotations.get('kind') ?? (obj as any).metadata?.get?.('kind')) : (obj as any)?.metadata?.get?.('kind');

        let objectKind: ObjectKind = 'plain';
        let resourceName: string | undefined = undefined;
        let typeName: string | undefined = undefined;

        if (kindAnnotation === 'resource' || (nameAnnotation && (nameAnnotation.endsWith('Resource') || nameAnnotation.endsWith('Response')))) {
            objectKind = 'resource';
            resourceName = nameAnnotation;
        } else if (kindAnnotation === 'model' || (nameAnnotation && !nameAnnotation.endsWith('Resource') && !nameAnnotation.endsWith('Response'))) {
            objectKind = 'model';
            typeName = nameAnnotation;
        } else if (kindAnnotation === 'response') {
            objectKind = 'response';
            typeName = nameAnnotation;
        }

        return new ResolvedObjectType({
            fields,
            objectKind,
            resourceName,
            typeName
        });
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
