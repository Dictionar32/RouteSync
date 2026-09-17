/**
 * Direct model-property binding. SemanticType is produced upstream by ModelSymbol.
 * No type-string parsing or semantic reclassification occurs here.
 */
import type { OriginModelSymbol } from "../../symbols/ModelSymbolTable";
import { ResourceFieldExpressionFactory } from "../../../../types/route";
import { BoundSemanticFactory } from "../../../../types/domain/boundAst";
import { ScannedResourceFieldDescriptor } from "../../descriptors/resourceDescriptors";
import { ErrorType, NullableType, SemanticType } from "../../../types/SemanticType";
import type { BoundNullability } from "../../../../types/domain/boundAst";
import type { BoundResourceFieldResult } from "../SemanticResourceBinder";

export function bindPropertyAccessField(
    key: string,
    prop: string,
    isNullsafe: boolean,
    modelSymbol?: OriginModelSymbol
): BoundResourceFieldResult {
    if (!modelSymbol) return unresolved(key);

    const binding = modelSymbol.resolveProperty(prop);
    if (!binding) return unresolved(key);

    switch (binding.kind) {
        case 'column': {
            const semanticType = applyNullsafe(binding.semanticType, isNullsafe);
            const boundAst = BoundSemanticFactory.modelColumn({
                model: modelSymbol.name,
                column: prop,
                dbType: binding.source.type,
                castType: null,
                semanticType
            });
            const descriptor = ScannedResourceFieldDescriptor.fromExpression(
                key,
                primitiveExpression(semanticType),
                semanticType.isNullable(),
                undefined,
                semanticType,
                boundAst
            );
            return { descriptor, boundAst };
        }
        case 'accessor': {
            const semanticType = applyNullsafe(binding.semanticType, isNullsafe);
            const boundAst = BoundSemanticFactory.methodCall({
                targetModel: modelSymbol.name,
                methodName: prop,
                returnType: semanticType,
                cardinality: { kind: 'single' },
                nullability: toNullability(semanticType)
            });
            const descriptor = ScannedResourceFieldDescriptor.fromExpression(
                key,
                primitiveExpression(semanticType),
                semanticType.isNullable(),
                undefined,
                semanticType,
                boundAst
            );
            return { descriptor, boundAst };
        }
        case 'relation': {
            const semanticType = applyNullsafe(binding.semanticType, isNullsafe);
            const cardinality = binding.source.cardinality === 'many'
                ? { kind: 'collection' as const }
                : { kind: 'single' as const };
            const boundAst = BoundSemanticFactory.relation({
                sourceModel: modelSymbol.name,
                relationName: prop,
                relationType: binding.source.type,
                targetModel: binding.source.targetModel,
                cardinality,
                nullability: toNullability(semanticType)
            });
            const expression = ResourceFieldExpressionFactory.resource(
                { kind: 'resource_name', value: binding.source.targetModel },
                cardinality
            );
            const descriptor = ScannedResourceFieldDescriptor.fromExpression(
                key,
                expression,
                semanticType.isNullable(),
                undefined,
                semanticType,
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

function primitiveExpression(type: SemanticType) {
    return type.kind === 'primitive'
        ? ResourceFieldExpressionFactory.primitive(type.type)
        : ResourceFieldExpressionFactory.unsupported('invalid_boundary_input');
}

function unresolved(key: string): BoundResourceFieldResult {
    const boundAst = BoundSemanticFactory.unsupported('unresolved_property');
    const expression = ResourceFieldExpressionFactory.unsupported('unresolved_property');
    const descriptor = ScannedResourceFieldDescriptor.fromExpression(
        key,
        expression,
        false,
        undefined,
        new ErrorType('Model property could not be resolved'),
        boundAst
    );
    return { descriptor, boundAst };
}
