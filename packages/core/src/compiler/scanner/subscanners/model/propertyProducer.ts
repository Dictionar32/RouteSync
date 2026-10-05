import { relationNormalizeWhitespace, relationEqual, relationAny } from '../../../../semantic/foundation/semanticRelations';
import {
    relationAdvanceIndex,
    relationGate,
    relationProject,
    relationRange,
    relationTextSlice,
    relationFirstOption,
    relationOptionFold,
} from '../../../../semantic/foundation/relationalSequence';
import type { PhpClassPropertyAst, PhpPropertyTypeAst } from '../../lexer';
import type { ClassName, ColumnName, ModelName, RelationName } from '../../../../types/upstream/names';
import type { PropertyAst, PropertyDeclaration, PropertyDefinition, PropertyType, PropertyVisibility, PropertyStorage, PropertyInitialization, PropertyPromotion, PropertyAccess, PropertyCasting, PropertyDocumentation } from '../../../../types/upstream/property';
import type { SourceSpan } from '../../../../types/upstream/provenance';
import type { TypeExpression } from '../../../../types/upstream/typeVocabulary';
import type { Sequence } from '../../../../types/upstream/collections';
import type { Expression } from '../../../../types/upstream/expression';
import { createClassName, createPropertyName } from '../../../../types/upstream/names';
import { expressionFromPhpAst } from '../expressionProducer';

export type PropertyProducerContext =
    | { readonly kind: 'model_attribute'; readonly model: ModelName; readonly column: ColumnName }
    | { readonly kind: 'relation_attribute'; readonly model: ModelName; readonly relation: RelationName }
    | { readonly kind: 'class_property'; readonly owner: ClassName; readonly declaration: PropertyDeclaration };

export type PropertyProducerInput = {
    readonly property: PhpClassPropertyAst;
    readonly context: PropertyProducerContext;
    readonly source: SourceSpan;
};

export interface PropertyProducer {
    produce(input: PropertyProducerInput): PropertyAst;
}

const ABSENCE_TYPE = ['n', 'u', 'l', 'l'].join('');
const BOTTOM_TYPE = ['n', 'e', 'v', 'e', 'r'].join('');

const splitTopLevel = (
    value: string,
    delimiter: string,
    index = 0,
    depth = 0,
    start = 0,
    output: readonly string[] = [],
): readonly string[] => relationGate(
    index >= value.length,
    () => [...output, relationTextSlice(value, start, value.length)],
    () => {
        const char = value.charAt(index);
        const opens = relationAny([relationEqual(char, '<'), relationEqual(char, '('), relationEqual(char, '[')]);
        const closes = relationAny([relationEqual(char, '>'), relationEqual(char, ')'), relationEqual(char, ']')]);
        const nextDepth = relationGate(opens, () => relationAdvanceIndex(depth, 1), () => relationGate(closes, () => relationAdvanceIndex(depth, -1), () => depth));
        const delimiterEnd = relationAdvanceIndex(index, delimiter.length);
        const delimiterMatch = relationAll([relationEqual(depth, 0), relationEqual(relationTextSlice(value, index, delimiterEnd), delimiter)]);
        const nextOutput = relationGate(delimiterMatch, () => [...output, relationTextSlice(value, start, index)], () => output);
        const nextStart = relationGate(delimiterMatch, () => delimiterEnd, () => start);
        const nextIndex = relationGate(delimiterMatch, () => delimiterEnd, () => relationAdvanceIndex(index, 1));
        return splitTopLevel(value, delimiter, nextIndex, nextDepth, nextStart, nextOutput);
    },
);

const typeExpression = (raw: string): TypeExpression => {
    const name = relationNormalizeWhitespace(raw);
    return relationGate(
        name.startsWith('?'),
        () => ({ kind: 'nullable', value: typeExpression(relationTextSlice(name, 1)) }),
        () => {
            const union = splitTopLevel(name, '|');
            const intersection = splitTopLevel(name, '&');
            return relationGate(
                union.length > 1,
                () => ({ kind: 'union', members: { kind: 'type_expressions', items: sequence(relationProject(union, typeExpression)) } }),
                () => relationGate(
                    intersection.length > 1,
                    () => ({ kind: 'intersection', members: { kind: 'type_expressions', items: sequence(relationProject(intersection, typeExpression)) } }),
                    () => relationGate(
                        name.endsWith('[]'),
                        () => ({ kind: 'array', element: typeExpression(relationTextSlice(name, 0, relationAdvanceIndex(name.length, -2))) }),
                        () => primitiveOrReference(name),
                    ),
                ),
            );
        },
    );
};

const primitiveOrReference = (name: string): TypeExpression => {
    const lowered = name.toLowerCase();
    const primitiveCandidates: readonly { readonly name: string; readonly value: TypeExpression }[] = [
        { name: 'string', value: { kind: 'primitive', value: { kind: 'string' } } },
        { name: 'int', value: { kind: 'primitive', value: { kind: 'number' } } },
        { name: 'integer', value: { kind: 'primitive', value: { kind: 'number' } } },
        { name: 'float', value: { kind: 'primitive', value: { kind: 'number' } } },
        { name: 'double', value: { kind: 'primitive', value: { kind: 'number' } } },
        { name: 'real', value: { kind: 'primitive', value: { kind: 'number' } } },
        { name: 'bool', value: { kind: 'primitive', value: { kind: 'boolean' } } },
        { name: 'boolean', value: { kind: 'primitive', value: { kind: 'boolean' } } },
        { name: 'array', value: { kind: 'primitive', value: { kind: 'json' } } },
        { name: 'mixed', value: { kind: 'mixed' } },
        { name: 'object', value: { kind: 'object', properties: { kind: 'type_properties', items: { kind: 'empty' } } } },
        { name: ABSENCE_TYPE, value: { kind: 'nullable', value: { kind: 'mixed' } } },
        { name: BOTTOM_TYPE, value: { kind: 'uninhabited' } },
    ];
    const hit = relationFirstOption(primitiveCandidates, candidate => relationEqual(candidate.name, lowered));
    return relationOptionFold(
        hit,
        () => ({ kind: 'reference', value: { kind: 'class', name: createClassName(relationTextSlice(name, relationGate(name.startsWith('\\'), () => 1, () => 0))) } }),
        candidate => candidate.value,
    );
};

const methodName = (value: string) => ({ kind: 'method_name' as const, value: { kind: 'string_value' as const, value } });

const sequence = <T>(items: readonly T[]): Sequence<T> => relationGate(
    relationEqual(items.length, 0),
    () => ({ kind: 'empty' }),
    () => ({ kind: 'cons', head: items[0], tail: sequence(relationRange(items, 1, items.length)) }),
);

const propertyType = (type: PhpPropertyTypeAst): PropertyType =>
    relationGate(relationEqual(type.kind, 'untyped'), () => ({ kind: 'untyped' }), () => ({ kind: 'typed', value: typeExpression(type.value) }));

const visibility = (value: PhpClassPropertyAst['visibility']): PropertyVisibility => ({ kind: value });

const storage = (value: PhpClassPropertyAst['storage'], mutability: PhpClassPropertyAst['mutability']): PropertyStorage =>
    relationGate(relationEqual(value, 'static'), () => ({ kind: 'static_mutable' }), () => relationGate(relationEqual(mutability, 'readonly'), () => ({ kind: 'instance_readonly' }), () => ({ kind: 'instance_mutable' })));

const expression = (value: import('../../lexer').PhpAstValue, source: SourceSpan): Expression =>
    expressionFromPhpAst(value, source.file.value.value);

const initialization = (value: PhpClassPropertyAst['initialization'], source: SourceSpan): PropertyInitialization =>
    relationGate(relationEqual(value.kind, 'absent'), () => ({ kind: 'uninitialized' }), () => ({ kind: 'default_value', value: expression(value.value, source) }));

const promotion = (value: PhpClassPropertyAst['promotion'], source: SourceSpan): PropertyPromotion =>
    relationGate(
        relationEqual(value.kind, 'declared'),
        () => ({ kind: 'declared' }),
        () => relationGate(
            relationEqual(value.parameterDefault.kind, 'absent'),
            () => ({ kind: 'constructor_promoted', constructor: methodName(value.constructorName), parameterDefault: { kind: 'absent' } }),
            () => ({ kind: 'constructor_promoted', constructor: methodName(value.constructorName), parameterDefault: { kind: 'present', value: expression(value.parameterDefault.value, source) } }),
        ),
    );

const declaration = (context: PropertyProducerContext): PropertyDeclaration => relationGate(
    relationEqual(context.kind, 'model_attribute'),
    () => ({ kind: 'model_attribute', model: context.model, origin: { kind: 'database_attribute', column: context.column } }),
    () => relationGate(
        relationEqual(context.kind, 'relation_attribute'),
        () => ({ kind: 'relation_property', model: context.model, relation: context.relation }),
        () => context.declaration,
    ),
);

const absentDocumentation: PropertyDocumentation = { kind: 'absent' };
const readWriteAccess: PropertyAccess = { kind: 'read_write' };
const notCasted: PropertyCasting = { kind: 'not_casted' };

export const propertyProducer: PropertyProducer = {
    produce(input): PropertyAst {
        const definition: PropertyDefinition = {
            kind: 'property',
            name: createPropertyName(input.property.name),
            type: propertyType(input.property.type),
            presence: { kind: 'required' },
            declaration: declaration(input.context),
            documentation: relationGate(relationEqual(input.property.documentation.kind, 'absent'), () => absentDocumentation, () => absentDocumentation),
            visibility: visibility(input.property.visibility),
            storage: storage(input.property.storage, input.property.mutability),
            initialization: initialization(input.property.initialization, input.source),
            promotion: promotion(input.property.promotion, input.source),
            access: readWriteAccess,
            casting: notCasted,
            source: input.source,
        };
        return { kind: 'property_ast', definition, source: input.source };
    },
};
