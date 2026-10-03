import { scannerSemanticType } from '../../../semanticTypeConstructionRelations';
/** Declarative direct model-property binding. */
import type { OriginModelSymbol } from "../../symbols/ModelSymbolTable";
import { createPropertyName } from "../../../../types/upstream/names";
import { toCamelCase } from "../../../../utils/resource-naming";
import { SemanticValueFactory } from "../../../../types/domain/semanticValues";
import { ResourceFieldExpressionFactory } from "../../../../types/route";
import { BoundSemanticFactory } from "../../../../types/domain/boundAst";
import { ScannedResourceFieldDescriptor } from "../../descriptors/resourceDescriptors";
import { ErrorType, NullableType, type SemanticType } from "../../../types/SemanticType";
import type { BoundNullability } from "../../../../types/domain/boundAst";
import { matchPhpAccessMode } from "../../lexer/phpAstAlgebra";
import type { BoundResourceFieldResult } from "../SemanticResourceBinder";
import { relationResolve } from "../../../../semantic/kernel/relationalSequence";

export function bindPropertyAccessField(key: string, prop: string, isNullsafe: boolean, modelSymbol: OriginModelSymbol): BoundResourceFieldResult {
    const binding = modelSymbol.resolveProperty(createPropertyName(prop));
    return relationResolve(Object.is(binding.kind, 'missing'), () => unresolved(key), () => bindResolved(key, prop, isNullsafe, modelSymbol, binding.value));
}

const bindResolved = (key: string, prop: string, isNullsafe: boolean, modelSymbol: OriginModelSymbol, binding: Exclude<ReturnType<OriginModelSymbol['resolveProperty']>, { kind: 'missing' }>): BoundResourceFieldResult =>
    relationResolve(Object.is(binding.value.kind, 'column'), () => bindColumn(key, isNullsafe, modelSymbol, binding.value), () =>
        relationResolve(Object.is(binding.value.kind, 'accessor'), () => bindAccessor(key, isNullsafe, modelSymbol, binding.value), () => bindRelation(key, modelSymbol, binding.value)));

const applyNullsafe = (type: SemanticType, nullsafe: boolean): SemanticType => relationResolve(relationResolve(nullsafe, () => !type.isNullable(), () => false), () => scannerSemanticType.nullable(type), () => type);
const toNullability = (type: SemanticType): BoundNullability => relationResolve(type.isNullable(), () => ({ kind: 'nullable' }), () => ({ kind: 'non_nullable' }));
const accessExpression = (target: ReturnType<typeof ResourceFieldExpressionFactory.model>, isNullsafe: boolean, direct: (t: typeof target) => ReturnType<typeof ResourceFieldExpressionFactory.propertyAccess>, safe: (t: typeof target) => ReturnType<typeof ResourceFieldExpressionFactory.nullsafePropertyAccess>) => matchPhpAccessMode(relationResolve(isNullsafe, () => ({ kind: 'nullsafe' as const }), () => ({ kind: 'direct' as const })), { direct, nullsafe: safe });

function bindColumn(key: string, isNullsafe: boolean, model: OriginModelSymbol, value: Extract<ReturnType<OriginModelSymbol['resolveProperty']>, { kind: 'resolved' }>['value'] & { kind: 'column' }): BoundResourceFieldResult {
    const semanticType = applyNullsafe(value.semanticType, isNullsafe);
    const boundAst = BoundSemanticFactory.modelColumn({ model: model.name, column: value.source.column, dbType: value.source.databaseType, castType: { kind: 'no_cast' }, semanticType });
    const target = ResourceFieldExpressionFactory.model(model.name);
    const expression = accessExpression(target, isNullsafe, t => ResourceFieldExpressionFactory.propertyAccess(t, value.source.property), t => ResourceFieldExpressionFactory.nullsafePropertyAccess(t, value.source.property));
    const descriptor = ScannedResourceFieldDescriptor.fromExpression(key, expression, semanticType, toCamelCase(key), boundAst);
    return { descriptor, boundAst };
}

function bindAccessor(key: string, isNullsafe: boolean, model: OriginModelSymbol, value: Extract<ReturnType<OriginModelSymbol['resolveProperty']>, { kind: 'resolved' }>['value'] & { kind: 'accessor' }): BoundResourceFieldResult {
    const semanticType = applyNullsafe(value.semanticType, isNullsafe);
    const boundAst = BoundSemanticFactory.methodCall({ targetModel: { kind: 'model', name: model.name }, methodName: value.source.method, returnType: semanticType, cardinality: { kind: 'single' }, nullability: toNullability(semanticType) });
    const target = ResourceFieldExpressionFactory.model(model.name);
    const expression = matchPhpAccessMode(relationResolve(isNullsafe, () => ({ kind: 'nullsafe' as const }), () => ({ kind: 'direct' as const })), { direct: () => ResourceFieldExpressionFactory.methodCall(target, value.source.method), nullsafe: () => ResourceFieldExpressionFactory.nullsafeMethodCall(target, value.source.method) });
    const descriptor = ScannedResourceFieldDescriptor.fromExpression(key, expression, semanticType, toCamelCase(key), boundAst);
    return { descriptor, boundAst };
}

function bindRelation(key: string, model: OriginModelSymbol, value: Extract<ReturnType<OriginModelSymbol['resolveProperty']>, { kind: 'resolved' }>['value'] & { kind: 'relation' }): BoundResourceFieldResult {
    const semanticType = value.semanticType;
    const boundAst = BoundSemanticFactory.relation({ sourceModel: model.name, relationName: value.source.relation, relationType: value.source.type, targetModel: value.source.targetModel, cardinality: value.source.boundCardinality, nullability: toNullability(semanticType), semanticType });
    const expression = ResourceFieldExpressionFactory.resource(SemanticValueFactory.resourceName(value.source.targetModel.value.value), value.source.resourceCardinality);
    const descriptor = ScannedResourceFieldDescriptor.fromExpression(key, expression, semanticType, toCamelCase(key), boundAst);
    return { descriptor, boundAst };
}

function unresolved(key: string): BoundResourceFieldResult {
    const boundAst = BoundSemanticFactory.unsupported('unresolved_property');
    const expression = ResourceFieldExpressionFactory.unsupported('unresolved_property');
    const descriptor = ScannedResourceFieldDescriptor.fromExpression(key, expression, scannerSemanticType.error('Model property could not be resolved'), toCamelCase(key), boundAst);
    return { descriptor, boundAst };
}
