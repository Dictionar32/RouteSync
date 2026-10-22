import { relationEqual } from '../../../../semantic/relations/semanticRelations';
import {
    relationGate,
    relationProject,
    relationRange,
} from '../../../../semantic/relations/relationalSequence';
import type { PhpClassPropertyAst, PhpPropertyTypeAst } from '../../lexer';
import type { ClassName, ColumnName, ModelName, RelationName } from '../../../../types/upstream/names';
import type { PropertyAst, PropertyDeclaration, PropertyDefinition, PropertyType, PropertyVisibility, PropertyStorage, PropertyInitialization, PropertyPromotion, PropertyAccess, PropertyCasting, PropertyDocumentation } from '../../../../types/upstream/property';
import type { SourceSpan } from '../../../../types/upstream/provenance';
import type { TypeExpression } from '../../../../types/upstream/typeVocabulary';
import type { Sequence } from '../../../../types/upstream/collections';
import type { Expression } from '../../../../types/upstream/expression';
import { createPropertyName } from '../../../../types/upstream/names';
import { phpTypeExpressionAlgebra } from '../../../../types/upstream/phpTypeExpressionAlgebra';
import { stringValue } from '../../../../types/upstream/valueObjects';
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

const typeExpression = (raw: string): TypeExpression => {
    const judgment = phpTypeExpressionAlgebra.resolve({ source: raw });
    return judgment.kind === 'resolved'
        ? judgment.expression
        : { kind: 'error', diagnostic: stringValue(judgment.diagnostic) };
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
