import type { TypeExpression } from '../../../types/upstream/typeVocabulary';
import type { PrimitiveVocabulary } from '../../../types/upstream/primitiveVocabulary';
import { resolvePrimitiveProjection, resolveTypeExpressionProjection, type TypeExpressionProjection } from './typeExpressionSemanticRelations';
import { relationResolve, relationSequenceToArray, relationProject } from '../../../semantic/kernel/relationalSequence';
import {
    CollectionKind, ErrorType, GenericType, JsonValueType, NeverType, NullableType, OptionalType, primitiveType,
    ObjectType, PrimitiveKind, PrimitiveType, ReadonlyCollectionType, ReferenceType, UnionType, IntersectionType,
    type GenericParameter, type SemanticType, ScannedObjectProperty
} from '../../types/SemanticType';

export function typeExpressionToSemanticType(type: TypeExpression): SemanticType {
    const projection = resolveTypeExpressionProjection(type);
    return TYPE_EXPRESSION_HANDLERS[projection](type);
}

type Handler<K extends TypeExpression['kind']> = (type: Extract<TypeExpression, { readonly kind: K }>) => SemanticType;

const lift = <K extends TypeExpression['kind']>(
    handler: Handler<K>,
): ((type: TypeExpression) => SemanticType) =>
    type => handler(type as Extract<TypeExpression, { readonly kind: K }>);

const TYPE_EXPRESSION_HANDLERS: Readonly<Record<TypeExpressionProjection, (type: TypeExpression) => SemanticType>> = Object.freeze({
    primitive: lift<'primitive'>(type => primitive(type.value.kind)),
    reference: lift<'reference'>(type => ReferenceType(referenceNamespace(type.value.kind), type.value.name.value.value)),
    array: lift<'array'>(type => ReadonlyCollectionType(CollectionKind.ARRAY, typeExpressionToSemanticType(type.element))),
    array_map: lift<'array_map'>(type => ReadonlyCollectionType(CollectionKind.ARRAY, typeExpressionToSemanticType(type.value))),
    mixed: lift<'mixed'>(() => JsonValueType()),
    union: lift<'union'>(type => UnionType(relationProject(relationSequenceToArray(type.members.items), typeExpressionToSemanticType))),
    intersection: lift<'intersection'>(type => IntersectionType(relationProject(relationSequenceToArray(type.members.items), typeExpressionToSemanticType))),
    nullable: lift<'nullable'>(type => NullableType(typeExpressionToSemanticType(type.value))),
    optional: lift<'optional'>(type => OptionalType(typeExpressionToSemanticType(type.value))),
    uninhabited: lift<'uninhabited'>(() => NeverType()),
    error: lift<'error'>(type => ErrorType(type.diagnostic.value)),
    object: lift<'object'>(type => ObjectType({
        name: 'AnonymousResourceObject',
        baseName: 'AnonymousResourceObject',
        properties: relationProject(relationSequenceToArray(type.properties.items), property => ScannedObjectProperty.create({
            name: property.name,
            type: typeExpressionToSemanticType(property.type),
            description: '',
            origin: { kind: 'derived', reason: 'nested_object' }
        })),
        role: 'plain'
    })),
    generic: lift<'generic'>(type => GenericType(
        ReferenceType(referenceNamespace(type.base.kind), type.base.name.value.value),
        relationProject(relationSequenceToArray(type.parameters.items), (parameter): GenericParameter => ({
            name: parameter.name,
            variance: 'invariant',
            type: typeExpressionToSemanticType(parameter.type)
        }))
    )),
    callable: lift<'callable'>(() => ErrorType('callable_type_not_supported_by_object_type_legacy_boundary')),
});

function primitive(kind: PrimitiveVocabulary['kind']): PrimitiveType | JsonValueType {
    const projection = resolvePrimitiveProjection({ kind } as PrimitiveVocabulary);
    return PRIMITIVE_HANDLERS[projection]();
}

const PRIMITIVE_HANDLERS: Readonly<Record<string, () => PrimitiveType | JsonValueType>> = Object.freeze({
    string: () => primitiveType(PrimitiveKind.STRING),
    number: () => primitiveType(PrimitiveKind.NUMBER),
    boolean: () => primitiveType(PrimitiveKind.BOOLEAN),
    date_time: () => primitiveType(PrimitiveKind.DATETIME),
    file: () => primitiveType(PrimitiveKind.FILE),
    json: () => JsonValueType(),
    unspecified: () => primitiveType(PrimitiveKind.UNSPECIFIED),
});

function referenceNamespace(kind: 'class' | 'domain'): string {
    return relationResolve(Object.is(kind, 'class'), () => '', () => '');
}

