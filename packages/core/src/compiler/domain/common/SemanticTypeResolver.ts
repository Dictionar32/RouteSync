/**
 * SemanticTypeResolver.ts
 *
 * Central Polymorphic Resolver Strategy Pipeline for Transforming Raw AST SemanticTypes
 * into Target-Agnostic Structured ResolvedSemanticType Domain Value Objects.
 *
 * @module compiler/domain/common
 */

import {
    PrimitiveType,
    ReferenceType,
    ObjectType,
    ReadonlyCollectionType,
    MutableCollectionType,
    UnionType,
    IntersectionType,
    NullableType,
    PrimitiveKind,
    CollectionKind,
    type SemanticType
} from '../../types/SemanticType';
import type { ResourceFieldDescriptor } from '../../../types/route';

import {
    ResolvedPrimitiveType,
    ResolvedReferenceType,
    ResolvedNullableType,
    ResolvedOptionalType,
    ResolvedCollectionType,
    ResolvedObjectType,
    ResolvedUnionType,
    ResolvedIntersectionType,
    ResolvedUnknownType,
    type ResolvedSemanticType,
    type ResolvedField,
    type ObjectKind
} from './ResolvedSemanticType';

export interface SemanticTypeResolverLike {
    resolve(type: SemanticType): ResolvedSemanticType;
}

export interface SemanticTypeHandler {
    supports(type: SemanticType): boolean;
    resolve(type: SemanticType, resolver: SemanticTypeResolverLike): ResolvedSemanticType;
}

export class PrimitiveTypeHandler implements SemanticTypeHandler {
    supports(type: SemanticType): boolean {
        return type.kind === 'primitive';
    }

    resolve(type: SemanticType): ResolvedSemanticType {
        const prim = type as PrimitiveType;
        return new ResolvedPrimitiveType({ primitiveKind: prim.type });
    }
}

export class ReferenceTypeHandler implements SemanticTypeHandler {
    supports(type: SemanticType): boolean {
        return type.kind === 'reference';
    }

    resolve(type: SemanticType): ResolvedSemanticType {
        const ref = type as ReferenceType;
        return new ResolvedReferenceType({ name: ref.name, namespace: ref.namespace });
    }
}

export class CollectionTypeHandler implements SemanticTypeHandler {
    supports(type: SemanticType): boolean {
        return type.kind === 'readonly_collection' || type.kind === 'mutable_collection';
    }

    resolve(type: SemanticType, resolver: SemanticTypeResolverLike): ResolvedSemanticType {
        const col = type as ReadonlyCollectionType | MutableCollectionType;
        return new ResolvedCollectionType({ elementType: resolver.resolve(col.elementType) });
    }
}

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

const DEFAULT_HANDLERS: readonly SemanticTypeHandler[] = Object.freeze([
    new PrimitiveTypeHandler(),
    new ReferenceTypeHandler(),
    new CollectionTypeHandler(),
    new NullableWrapperHandler(),
    new DefaultObjectHandler(),
    new UnionTypeHandler(),
    new IntersectionTypeHandler()
]);

const EMPTY_CUSTOM_HANDLERS: readonly SemanticTypeHandler[] = Object.freeze([]);

export interface SemanticTypeResolverParams {
    readonly customHandlers: readonly SemanticTypeHandler[];
}

export class SemanticTypeResolver implements SemanticTypeResolverLike {
    private readonly handlers: readonly SemanticTypeHandler[];

    constructor(params: SemanticTypeResolverParams);
    constructor(params?: { readonly customHandlers?: readonly SemanticTypeHandler[] });
    constructor({ customHandlers = EMPTY_CUSTOM_HANDLERS }: { readonly customHandlers?: readonly SemanticTypeHandler[] } = {}) {
        this.handlers = Object.freeze([...customHandlers, ...DEFAULT_HANDLERS]);
    }

    public static default(): SemanticTypeResolver {
        return new SemanticTypeResolver({ customHandlers: EMPTY_CUSTOM_HANDLERS });
    }

    public static withHandlers(customHandlers: readonly SemanticTypeHandler[]): SemanticTypeResolver {
        return new SemanticTypeResolver({ customHandlers });
    }

    resolve(type: SemanticType): ResolvedSemanticType {
        for (const handler of this.handlers) {
            if (handler.supports(type)) {
                return handler.resolve(type, this);
            }
        }
        return new ResolvedUnknownType({
            diagnosticMessage: `unsupported SemanticType kind '${(type as any)?.kind}'`
        });
    }

    public static resolveField(field: ResourceFieldDescriptor): SemanticType {
        let type: SemanticType;
        switch (field.expression.kind) {
            case 'primitive':
                type = PrimitiveType.fromPhpType(field.expression.type);
                break;
            case 'resource':
                type = new ReferenceType('', field.expression.resource);
                if (field.expression.collection) {
                    type = new ReadonlyCollectionType(CollectionKind.ARRAY, type);
                }
                break;
            default:
                type = new PrimitiveType(PrimitiveKind.UNKNOWN);
                break;
        }

        if (field.nullable) {
            type = new NullableType(type);
        }

        return type;
    }
}
