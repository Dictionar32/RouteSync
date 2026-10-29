import type { PhpClassPropertyAst, PhpPropertyTypeAst, PhpAstValue } from '../frontend/php';
import type { PropertyProducerContext, PropertyProducerInput, PropertyProducerInterface } from '../../types/upstream/propertyProducerInterface';
import type { PropertyAst, PropertyDeclaration, PropertyDefinition, PropertyType, PropertyVisibility, PropertyStorage, PropertyInitialization, PropertyPromotion, PropertyAccess, PropertyCasting, PropertyDocumentation } from '../../types/upstream/property';
import type { SourceSpan } from '../../types/upstream/provenance';
import type { TypeExpression } from '../../types/upstream/typeVocabulary';
import type { Expression } from '../../types/upstream/expression';
import { createPropertyName } from '../../types/upstream/names';
import { phpTypeExpressionAlgebra } from '../../types/upstream/phpTypeExpressionAlgebra';
import { stringValue } from '../../types/upstream/valueObjects';
import { expressionFromPhpAst } from './expressionProducer';


const typeExpression = (raw: string): TypeExpression => {
    const judgment = phpTypeExpressionAlgebra.resolve({ source: raw });
    return judgment.kind === 'resolved'
        ? judgment.expression
        : { kind: 'error', diagnostic: stringValue.create(judgment.diagnostic) };
};

const methodName = (value: string) => ({ kind: 'method_name' as const, value: { kind: 'string_value' as const, value } });

const propertyType = (type: PhpPropertyTypeAst): PropertyType => type.kind === 'untyped'
    ? { kind: 'untyped' }
    : { kind: 'typed', value: typeExpression(type.value) };

const visibility = (value: PhpClassPropertyAst['visibility']): PropertyVisibility => ({ kind: value });

const storage = (value: PhpClassPropertyAst['storage'], mutability: PhpClassPropertyAst['mutability']): PropertyStorage => value === 'static'
    ? { kind: 'static_mutable' }
    : mutability === 'readonly'
        ? { kind: 'instance_readonly' }
        : { kind: 'instance_mutable' };

const expression = (value: PhpAstValue, source: SourceSpan): Expression =>
    expressionFromPhpAst.project({ syntax: value, sourceFile: source.file });

const initialization = (value: PhpClassPropertyAst['initialization'], source: SourceSpan): PropertyInitialization => value.kind === 'absent'
    ? { kind: 'uninitialized' }
    : { kind: 'default_value', value: expression(value.value, source) };

const promotion = (value: PhpClassPropertyAst['promotion'], source: SourceSpan): PropertyPromotion => value.kind === 'declared'
    ? { kind: 'declared' }
    : value.parameterDefault.kind === 'absent'
        ? { kind: 'constructor_promoted', constructor: methodName(value.constructorName), parameterDefault: { kind: 'absent' } }
        : { kind: 'constructor_promoted', constructor: methodName(value.constructorName), parameterDefault: { kind: 'present', value: expression(value.parameterDefault.value, source) } };

const declaration = (context: PropertyProducerContext): PropertyDeclaration => context.kind === 'model_attribute'
    ? { kind: 'model_attribute', model: context.model, origin: { kind: 'database_attribute', column: context.column } }
    : context.kind === 'relation_attribute'
        ? { kind: 'relation_property', model: context.model, relation: context.relation }
        : context.declaration;

const absentDocumentation: PropertyDocumentation = { kind: 'absent' };
const readWriteAccess: PropertyAccess = { kind: 'read_write' };
const notCasted: PropertyCasting = { kind: 'not_casted' };

export const propertyProducer: PropertyProducerInterface<PhpClassPropertyAst> = Object.freeze({
    produce(input: PropertyProducerInput<PhpClassPropertyAst>): PropertyAst {
        const definition: PropertyDefinition = {
            kind: 'property',
            name: createPropertyName(input.property.name),
            type: propertyType(input.property.type),
            presence: { kind: 'required' },
            declaration: declaration(input.context),
            documentation: absentDocumentation,
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
});
