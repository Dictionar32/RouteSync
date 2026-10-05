import { scannerSemanticType } from '../../semanticTypeConstructionRelations';
/** Declarative direct model-property binding. */
import type { OriginModelSymbol } from "../../symbols/ModelSymbolTable";
import { createPropertyName } from "../../../../types/upstream/names";
import { toCamelCase } from "../../../../utils/resource-naming";
import { SemanticValueFactory } from "../../../../types/domain/semanticValues";
import { ResourceFieldExpressionFactory } from "../../../../types/route";
import { BoundSemanticFactory } from "../../../../types/domain/boundAst";
import { ResourceFieldSemanticBinding } from "../../../../types/domain/resourceFieldSemanticBinding";
import type { SemanticType } from "../../../types/SemanticType";
import type { BoundNullability } from "../../../../types/domain/boundAst";
import type { ResourceFieldExpression } from "../../../../types/domain/expressions";
import { matchPhpAccessMode } from "../../lexer/phpAstAlgebra";
import type { PhpAccessMode } from "../../lexer/phpAstExpressionTypes";
import type { BoundResourceFieldResult } from "../SemanticResourceBinder";
import { matchLookup } from "../../../../types/upstream/collections";
import { relationVariantFold } from "../../../../semantic/foundation/relationalSequence";
import { relationResolve } from "../../../../semantic/foundation/relationalSequence";
import type { ResolvedPropertyBinding } from "../../symbols/model/types";

export function bindPropertyAccessField(
    key: string,
    prop: string,
    access: PhpAccessMode,
    modelSymbol: OriginModelSymbol,
): BoundResourceFieldResult {
    const propertyName = createPropertyName(prop);
    return matchLookup(modelSymbol.resolveProperty(propertyName), {
        missing: () => unresolved(key),
        found: lookup => bindResolved(key, access, modelSymbol, lookup.value),
    });
}

const bindResolved = (
    key: string,
    access: PhpAccessMode,
    modelSymbol: OriginModelSymbol,
    binding: ResolvedPropertyBinding,
): BoundResourceFieldResult => relationVariantFold(
    binding,
    'column',
    rest => relationVariantFold(
        rest,
        'accessor',
        relation => bindRelation(key, modelSymbol, relation, access),
        accessor => bindAccessor(key, modelSymbol, accessor, access),
    ),
    column => bindColumn(key, modelSymbol, column, access),
);

const applyNullsafe = (type: SemanticType, access: PhpAccessMode): SemanticType => matchPhpAccessMode(access, {
    direct: () => type,
    nullsafe: () => relationResolve(!type.isNullable(), () => scannerSemanticType.nullable(type), () => type),
});

const toNullability = (type: SemanticType): BoundNullability => relationResolve(
    type.isNullable(),
    () => ({ kind: 'nullable' }),
    () => ({ kind: 'non_nullable' }),
);

function bindColumn(
    key: string,
    model: OriginModelSymbol,
    value: Extract<ResolvedPropertyBinding, { kind: 'column' }>,
    access: PhpAccessMode,
): BoundResourceFieldResult {
    const semanticType = applyNullsafe(value.semanticType, access);
    const boundAst = BoundSemanticFactory.modelColumn({
        model: model.name,
        column: value.source.column,
        dbType: value.source.databaseType,
        castType: { kind: 'no_cast' },
        semanticType,
    });
    const target = ResourceFieldExpressionFactory.model(model.name);
    const expression = matchPhpAccessMode<ResourceFieldExpression>(access, {
        direct: () => ResourceFieldExpressionFactory.propertyAccess(target, value.source.property),
        nullsafe: () => ResourceFieldExpressionFactory.nullsafePropertyAccess(target, value.source.property),
    });
    const binding = ResourceFieldSemanticBinding.fromExpression(key, expression, semanticType, toCamelCase(key), boundAst);
    return { binding, boundAst };
}

function bindAccessor(
    key: string,
    model: OriginModelSymbol,
    value: Extract<ResolvedPropertyBinding, { kind: 'accessor' }>,
    access: PhpAccessMode,
): BoundResourceFieldResult {
    const semanticType = applyNullsafe(value.semanticType, access);
    const boundAst = BoundSemanticFactory.methodCall({
        targetModel: { kind: 'model', name: model.name },
        methodName: value.source.method,
        returnType: semanticType,
        cardinality: { kind: 'single' },
        nullability: toNullability(semanticType),
    });
    const target = ResourceFieldExpressionFactory.model(model.name);
    const expression = matchPhpAccessMode<ResourceFieldExpression>(access, {
        direct: () => ResourceFieldExpressionFactory.methodCall(target, value.source.method),
        nullsafe: () => ResourceFieldExpressionFactory.nullsafeMethodCall(target, value.source.method),
    });
    const binding = ResourceFieldSemanticBinding.fromExpression(key, expression, semanticType, toCamelCase(key), boundAst);
    return { binding, boundAst };
}

function bindRelation(
    key: string,
    model: OriginModelSymbol,
    value: Extract<ResolvedPropertyBinding, { kind: 'relation' }>,
    access: PhpAccessMode,
): BoundResourceFieldResult {
    const semanticType = applyNullsafe(value.semanticType, access);
    const boundAst = BoundSemanticFactory.relation({
        sourceModel: model.name,
        relationName: value.source.relation,
        relationType: value.source.eloquentType,
        targetModel: value.source.targetModel,
        cardinality: value.source.boundCardinality,
        nullability: toNullability(semanticType),
        semanticType,
    });
    const expression = ResourceFieldExpressionFactory.resource(
        SemanticValueFactory.resourceName(value.source.targetModel.value.value),
        value.source.resourceCardinality,
    );
    const binding = ResourceFieldSemanticBinding.fromExpression(key, expression, semanticType, toCamelCase(key), boundAst);
    return { binding, boundAst };
}

function unresolved(key: string): BoundResourceFieldResult {
    const boundAst = BoundSemanticFactory.unsupported('unresolved_property');
    const expression = ResourceFieldExpressionFactory.unsupported('unresolved_property');
    const binding = ResourceFieldSemanticBinding.fromExpression(
        key,
        expression,
        scannerSemanticType.error('Model property could not be resolved'),
        toCamelCase(key),
        boundAst,
    );
    return { binding, boundAst };
}
