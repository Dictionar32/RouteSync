import type { TypeExpression } from '../upstream/typeVocabulary';
import type { PrimitiveVocabulary } from '../upstream/primitiveVocabulary';
import { resolvePrimitiveProjection, resolveTypeExpressionProjection, type TypeExpressionProjection } from './typeExpressionSemanticRelations';
import {
    CollectionKind, ErrorType, GenericType, JsonValueType, NeverType, NullableType, OptionalType, primitiveType,
    ObjectType, PrimitiveKind, PrimitiveType, ReadonlyCollectionType, ReferenceType, UnionType, IntersectionType,
    type GenericParameter, type SemanticType, ScannedObjectProperty
} from './semanticType';
import {
    relationProject,
    relationSequenceToArray,
    relationResolve,
    relationVariantFold,
} from '../../semantic/foundation/relationalSequence';

/**
 * Canonical TypeExpression -> SemanticType lowering.
 *
 * TypeExpression is a closed ADT. Variant dispatch therefore stays on the
 * semantic relation substrate instead of reconstructing variants with casts.
 */
export function typeExpressionToSemanticType(type: TypeExpression): SemanticType {
    const projection = resolveTypeExpressionProjection(type);
    return relationResolve(
        Object.is(projection, type.kind),
        () => lowerTypeExpression(type),
        () => ErrorType(`TypeExpression projection mismatch for '${type.kind}'`),
    );
}

function lowerTypeExpression(type: TypeExpression): SemanticType {
    return relationVariantFold(type, 'primitive', lowerNonPrimitiveType, lowerPrimitive);
}

function lowerNonPrimitiveType(type: Exclude<TypeExpression, { readonly kind: 'primitive' }>): SemanticType {
    return relationVariantFold(type, 'reference', lowerArray, lowerReference);
}

function lowerReference(type: Extract<TypeExpression, { readonly kind: 'reference' }>): SemanticType {
    return ReferenceType(referenceNamespace(type.value.kind), type.value.name.value.value);
}

function lowerArray(type: Exclude<TypeExpression, { readonly kind: 'primitive' | 'reference' }>): SemanticType {
    return relationVariantFold(type, 'array', lowerArrayMap, value =>
        ReadonlyCollectionType(CollectionKind.ARRAY, typeExpressionToSemanticType(value.element)),
    );
}

function lowerArrayMap(type: Exclude<TypeExpression, { readonly kind: 'primitive' | 'reference' | 'array' }>): SemanticType {
    return relationVariantFold(type, 'array_map', lowerMixed, value =>
        ReadonlyCollectionType(CollectionKind.ARRAY, typeExpressionToSemanticType(value.value)),
    );
}

function lowerMixed(type: Exclude<TypeExpression, { readonly kind: 'primitive' | 'reference' | 'array' | 'array_map' }>): SemanticType {
    return relationVariantFold(type, 'mixed', lowerUnion, () => JsonValueType());
}

function lowerUnion(type: Exclude<TypeExpression, { readonly kind: 'primitive' | 'reference' | 'array' | 'array_map' | 'mixed' }>): SemanticType {
    return relationVariantFold(type, 'union', lowerIntersection, value =>
        UnionType(relationProject(relationSequenceToArray(value.members.items), typeExpressionToSemanticType)),
    );
}

function lowerIntersection(type: Exclude<TypeExpression, { readonly kind: 'primitive' | 'reference' | 'array' | 'array_map' | 'mixed' | 'union' }>): SemanticType {
    return relationVariantFold(type, 'intersection', lowerNullable, value =>
        IntersectionType(relationProject(relationSequenceToArray(value.members.items), typeExpressionToSemanticType)),
    );
}

function lowerNullable(type: Exclude<TypeExpression, { readonly kind: 'primitive' | 'reference' | 'array' | 'array_map' | 'mixed' | 'union' | 'intersection' }>): SemanticType {
    return relationVariantFold(type, 'nullable', lowerOptional, value =>
        NullableType(typeExpressionToSemanticType(value.value)),
    );
}

function lowerOptional(type: Exclude<TypeExpression, { readonly kind: 'primitive' | 'reference' | 'array' | 'array_map' | 'mixed' | 'union' | 'intersection' | 'nullable' }>): SemanticType {
    return relationVariantFold(type, 'optional', lowerUninhabited, value =>
        OptionalType(typeExpressionToSemanticType(value.value)),
    );
}

function lowerUninhabited(type: Exclude<TypeExpression, { readonly kind: 'primitive' | 'reference' | 'array' | 'array_map' | 'mixed' | 'union' | 'intersection' | 'nullable' | 'optional' }>): SemanticType {
    return relationVariantFold(type, 'uninhabited', lowerError, () => NeverType());
}

function lowerError(type: Exclude<TypeExpression, { readonly kind: 'primitive' | 'reference' | 'array' | 'array_map' | 'mixed' | 'union' | 'intersection' | 'nullable' | 'optional' | 'uninhabited' }>): SemanticType {
    return relationVariantFold(type, 'error', lowerObject, value => ErrorType(value.diagnostic.value));
}

function lowerObject(type: Exclude<TypeExpression, { readonly kind: 'primitive' | 'reference' | 'array' | 'array_map' | 'mixed' | 'union' | 'intersection' | 'nullable' | 'optional' | 'uninhabited' | 'error' }>): SemanticType {
    return relationVariantFold(type, 'object', lowerGeneric, value =>
        ObjectType({
            name: 'AnonymousResourceObject',
            baseName: 'AnonymousResourceObject',
            properties: relationProject(relationSequenceToArray(value.properties.items), property => ScannedObjectProperty.create({
                name: property.name,
                type: typeExpressionToSemanticType(property.type),
                description: '',
                origin: { kind: 'derived', reason: 'nested_object' }
            })),
            role: 'plain'
        }),
    );
}

function lowerGeneric(type: Exclude<TypeExpression, { readonly kind: 'primitive' | 'reference' | 'array' | 'array_map' | 'mixed' | 'union' | 'intersection' | 'nullable' | 'optional' | 'uninhabited' | 'error' | 'object' }>): SemanticType {
    return relationVariantFold(type, 'generic', lowerCallable, value =>
        GenericType(
            ReferenceType(referenceNamespace(value.base.kind), value.base.name.value.value),
            relationProject(relationSequenceToArray(value.parameters.items), (parameter): GenericParameter => ({
                name: parameter.name,
                variance: 'invariant',
                type: typeExpressionToSemanticType(parameter.type)
            }))
        ),
    );
}

function lowerCallable(type: Exclude<TypeExpression, { readonly kind: 'primitive' | 'reference' | 'array' | 'array_map' | 'mixed' | 'union' | 'intersection' | 'nullable' | 'optional' | 'uninhabited' | 'error' | 'object' | 'generic' }>): SemanticType {
    return relationVariantFold(type, 'callable', () => ErrorType('unreachable_type_expression_variant'), () =>
        ErrorType('callable_type_not_supported_by_object_type_legacy_boundary'),
    );
}

function lowerPrimitive(type: Extract<TypeExpression, { readonly kind: 'primitive' }>): SemanticType {
    return primitive(type.value);
}

function primitive(value: PrimitiveVocabulary): PrimitiveType | JsonValueType {
    return primitiveByProjection(resolvePrimitiveProjection(value));
}

function primitiveByProjection(projection: ReturnType<typeof resolvePrimitiveProjection>): PrimitiveType | JsonValueType {
    return relationResolve(
        Object.is(projection, 'string'),
        () => primitiveType(PrimitiveKind.STRING),
        () => relationResolve(
            Object.is(projection, 'number'),
            () => primitiveType(PrimitiveKind.NUMBER),
            () => relationResolve(
                Object.is(projection, 'boolean'),
                () => primitiveType(PrimitiveKind.BOOLEAN),
                () => relationResolve(
                    Object.is(projection, 'date_time'),
                    () => primitiveType(PrimitiveKind.DATETIME),
                    () => relationResolve(
                        Object.is(projection, 'file'),
                        () => primitiveType(PrimitiveKind.FILE),
                        () => relationResolve(
                            Object.is(projection, 'json'),
                            () => JsonValueType(),
                            () => primitiveType(PrimitiveKind.UNSPECIFIED),
                        ),
                    ),
                ),
            ),
        ),
    );
}

function referenceNamespace(kind: 'class' | 'domain'): string {
    return relationResolve(Object.is(kind, 'class'), () => '', () => '');
}
