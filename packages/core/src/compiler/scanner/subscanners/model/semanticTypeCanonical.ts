import { PrimitiveKind, type SemanticType, type SemanticTypeKind } from '../../../types/SemanticType';
import type { PrimitiveVocabulary } from '../../../../types/upstream/primitiveVocabulary';
import type { TypeExpression, TypeParameters } from '../../../../types/upstream/typeVocabulary';
import type { StringValue } from '../../../../types/upstream/valueObjects';
import type { SourceSpan } from '../../../../types/upstream/provenance';
const str = (value: string): StringValue => ({ kind: 'string_value', value });
const sequence = <T>(items: readonly T[]): import('../../../../types/upstream/collections').Sequence<T> => items.reduceRight<import('../../../../types/upstream/collections').Sequence<T>>((tail, head) => ({ kind: 'cons', head, tail }), { kind: 'empty' });
const property = (value: string) => ({ kind: 'property_name' as const, value: str(value) });
const sourceSpan = (file: string, length: number): SourceSpan => ({ kind: 'source_span', file: { kind: 'source_file', value: str(file) }, start: { kind: 'number_value', value: 0 }, end: { kind: 'number_value', value: length } });

const primitiveByKind: { readonly [K in PrimitiveKind]: TypeExpression } = {
    [PrimitiveKind.STRING]: { kind: 'primitive', value: { kind: 'string' } }, [PrimitiveKind.NUMBER]: { kind: 'primitive', value: { kind: 'number' } },
    [PrimitiveKind.BOOLEAN]: { kind: 'primitive', value: { kind: 'boolean' } }, [PrimitiveKind.DATETIME]: { kind: 'primitive', value: { kind: 'date_time' } },
    [PrimitiveKind.FILE]: { kind: 'primitive', value: { kind: 'file' } }, [PrimitiveKind.UNKNOWN]: { kind: 'error', diagnostic: str('unresolved_primitive') }, [PrimitiveKind.UNSPECIFIED]: { kind: 'error', diagnostic: str('unspecified_primitive') }
};
type SemanticOf<K extends SemanticTypeKind> = Extract<SemanticType, { readonly kind: K }>;
type SemanticHandler<K extends SemanticTypeKind> = (value: SemanticOf<K>) => TypeExpression;
const semanticHandlers: { readonly [K in SemanticTypeKind]: SemanticHandler<K> } = {
    primitive: value => primitiveByKind[value.type],
    json_value: () => ({ kind: 'primitive', value: { kind: 'json' } }),
    optional: value => ({ kind: 'optional', value: semanticType(value.innerType) }),
    nullable: value => ({ kind: 'nullable', value: semanticType(value.innerType) }),
    never: () => ({ kind: 'never' }),
    error: value => ({ kind: 'error', diagnostic: value.diagnosticMessage }),
    reference: value => ({ kind: 'reference', value: { kind: 'domain', name: { kind: 'domain_type_name', value: str(value.namespace + '\\' + value.name) } } }),
    union: value => ({ kind: 'union', members: typeExpressions(value.members) }),
    intersection: value => ({ kind: 'intersection', members: typeExpressions(value.members) }),
    readonly_collection: value => ({ kind: 'array', element: semanticType(value.elementType) }),
    mutable_collection: value => ({ kind: 'array', element: semanticType(value.elementType) }),
    generic: value => ({ kind: 'generic', base: { kind: 'class', name: { kind: 'class_name', value: str(value.base.name) } }, parameters: genericParameters(value.parameters) }),
    object: value => ({ kind: 'object', properties: { kind: 'type_properties', items: sequence(value.properties.map(item => ({ kind: 'type_property', name: property(item.name), type: semanticType(item.type), source: sourceSpan('', 0) }))) } })
};
export const semanticType = (value: SemanticType): TypeExpression => semanticHandlers[value.kind](value as never);
const typeExpressions = (values: readonly SemanticType[]): import('../../../../types/upstream/typeVocabulary').TypeExpressions => ({ kind: 'type_expressions', items: sequence(values.map(semanticType)) });
const genericParameters = (values: readonly { readonly name: string; readonly type: SemanticType }[]): TypeParameters => ({ kind: 'type_parameters', items: sequence(values.map(value => ({ kind: 'type_parameter', name: { kind: 'variable_name', value: str(value.name) }, type: semanticType(value.type), source: sourceSpan('', 0) }))) });

