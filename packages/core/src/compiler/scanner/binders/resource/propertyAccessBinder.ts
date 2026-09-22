/**
 * Direct model-property binding. SemanticType is produced upstream by ModelSymbol.
 * No type-string parsing or semantic reclassification occurs here.
 */
import type { OriginModelSymbol } from "../../symbols/ModelSymbolTable";
import { createPropertyName } from "../../../../types/upstream/names";
import { SemanticValueFactory } from "../../../../types/domain/semanticValues";
import { ResourceFieldExpressionFactory } from "../../../../types/route";
import { BoundSemanticFactory } from "../../../../types/domain/boundAst";
import { ScannedResourceFieldDescriptor } from "../../descriptors/resourceDescriptors";
import { ErrorType, NullableType, SemanticType } from "../../../types/SemanticType";
import type { BoundNullability } from "../../../../types/domain/boundAst";
import { matchPhpAccessMode } from "../../lexer/phpAstAlgebra";
import type { BoundResourceFieldResult } from "../SemanticResourceBinder";

export function bindPropertyAccessField(
    key: string,
    prop: string,
    isNullsafe: boolean,
    modelSymbol: OriginModelSymbol
): BoundResourceFieldResult {
    const binding = modelSymbol.resolveProperty(createPropertyName(prop));
    if (binding.kind === 'missing') return unresolved(key);

    switch (binding.value.kind) {
        case 'column': {
            const semanticType = applyNullsafe(binding.value.semanticType, isNullsafe);
            const boundAst = BoundSemanticFactory.modelColumn({
                model: modelSymbol.name,
                column: binding.value.source.column,
                dbType: binding.value.source.databaseType,
                castType: { kind: 'no_cast' },
                semanticType
            });
            const target = ResourceFieldExpressionFactory.model(modelSymbol.name);
            const expression = matchPhpAccessMode(
                isNullsafe ? { kind: 'nullsafe' as const } : { kind: 'direct' as const },
                {
                    direct: () => ResourceFieldExpressionFactory.propertyAccess(target, binding.value.source.property),
                    nullsafe: () => ResourceFieldExpressionFactory.nullsafePropertyAccess(target, binding.value.source.property),
                }
            );
            const descriptor = ScannedResourceFieldDescriptor.fromExpression(
                key,
                expression,
                semanticType,
                undefined,
                boundAst
            );
            return { descriptor, boundAst };
        }
        case 'accessor': {
            const semanticType = applyNullsafe(binding.value.semanticType, isNullsafe);
            const boundAst = BoundSemanticFactory.methodCall({
                targetModel: { kind: 'model', name: modelSymbol.name },
                methodName: binding.value.source.method,
                returnType: semanticType,
                cardinality: { kind: 'single' },
                nullability: toNullability(semanticType)
            });
            const target = ResourceFieldExpressionFactory.model(modelSymbol.name);
            const expression = matchPhpAccessMode(
                isNullsafe ? { kind: 'nullsafe' as const } : { kind: 'direct' as const },
                {
                    direct: () => ResourceFieldExpressionFactory.methodCall(target, binding.value.source.method),
                    nullsafe: () => ResourceFieldExpressionFactory.nullsafeMethodCall(target, binding.value.source.method),
                }
            );
            const descriptor = ScannedResourceFieldDescriptor.fromExpression(
                key,
                expression,
                semanticType,
                undefined,
                boundAst
            );
            return { descriptor, boundAst };
        }
        case 'relation': {
            const semanticType = applyNullsafe(binding.value.semanticType, isNullsafe);
            const cardinality = binding.value.source.resourceCardinality;
            const boundAst = BoundSemanticFactory.relation({
                sourceModel: modelSymbol.name,
                relationName: binding.value.source.relation,
                relationType: binding.value.source.type,
                targetModel: binding.value.source.targetModel,
                cardinality: binding.value.source.boundCardinality,
                nullability: toNullability(semanticType),
                semanticType
            });
            const expression = ResourceFieldExpressionFactory.resource(
                SemanticValueFactory.resourceName(binding.value.source.targetModel.value.value),
                cardinality
            );
            const descriptor = ScannedResourceFieldDescriptor.fromExpression(
                key,
                expression,
                semanticType,
                undefined,
                boundAst
            );
            return { descriptor, boundAst };
        }
    }
}

function applyNullsafe(type: SemanticType, nullsafe: boolean): SemanticType {
    return nullsafe && !type.isNullable() ? new NullableType(type) : type;
}

function toNullability(type: SemanticType): BoundNullability {
    return type.isNullable() ? { kind: 'nullable' } : { kind: 'non_nullable' };
}

function unresolved(key: string): BoundResourceFieldResult {
    const boundAst = BoundSemanticFactory.unsupported('unresolved_property');
    const expression = ResourceFieldExpressionFactory.unsupported('unresolved_property');
    const descriptor = ScannedResourceFieldDescriptor.fromExpression(
        key,
        expression,
        new ErrorType('Model property could not be resolved'),
        undefined,
        boundAst
    );
    return { descriptor, boundAst };
}
