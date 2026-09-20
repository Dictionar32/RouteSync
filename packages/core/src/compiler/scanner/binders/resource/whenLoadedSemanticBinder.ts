import type { OriginModelSymbol } from "../../symbols/ModelSymbolTable";
import { ResourceFieldExpressionFactory } from "../../../../types/route";
import { BoundSemanticFactory } from "../../../../types/domain/boundAst";
import { SemanticValueFactory } from "../../../../types/domain/semanticValues";
import type { ModelSemanticRelation } from "../../../../types/domain/models";
import { ScannedResourceFieldDescriptor } from "../../descriptors/resourceDescriptors";
import { ErrorType } from "../../../types/SemanticType";
import { toCamelCase } from "../../../../utils/resource-naming";
import { matchLookup, type Lookup } from "../../../../types/upstream/collections";
import type { BoundResourceFieldResult } from "../SemanticResourceBinder";

export function resolveWhenLoadedRelation(
    modelSymbol: OriginModelSymbol,
    relationName: string,
): Lookup<ModelSemanticRelation> {
    return modelSymbol.node.semantic.surface.relationsByName.lookup(SemanticValueFactory.relationName(relationName));
}

export function bindWhenLoadedResolution(
    key: string,
    resolution: Lookup<ModelSemanticRelation>,
): BoundResourceFieldResult {
    return matchLookup(resolution, {
        missing: () => unresolvedWhenLoaded(key),
        found: ({ value }) => bindResolvedWhenLoaded(key, value),
    });
}

function bindResolvedWhenLoaded(key: string, relation: ModelSemanticRelation): BoundResourceFieldResult {
    const semanticType = relation.semanticType;
    const target = BoundSemanticFactory.relation({
        sourceModel: relation.sourceModel,
        relationName: relation.relation,
        relationType: relation.type,
        targetModel: relation.targetModel,
        cardinality: relation.boundCardinality,
        nullability: { kind: 'nullable' },
        semanticType,
    });
    const boundAst = BoundSemanticFactory.conditional({
        wrapper: 'whenLoaded',
        conditionExpression: SemanticValueFactory.conditionExpression(relation.relation.value),
        target,
        relationModel: { kind: 'model', name: relation.targetModel },
        availability: { kind: 'present_when_loaded', relation: relation.relation },
        semanticType,
    });
    const expression = ResourceFieldExpressionFactory.resource(
        { kind: 'resource_name', value: relation.targetModel.value },
        relation.resourceCardinality,
    );
    const descriptor = ScannedResourceFieldDescriptor.fromExpression(key, expression, semanticType, toCamelCase(key), boundAst);
    return { descriptor, boundAst };
}

function unresolvedWhenLoaded(key: string): BoundResourceFieldResult {
    const boundAst = BoundSemanticFactory.unsupported('unresolved_relation');
    const expression = ResourceFieldExpressionFactory.unsupported('unresolved_relation');
    const descriptor = ScannedResourceFieldDescriptor.fromExpression(
        key, expression, new ErrorType('whenLoaded relation could not be resolved'), toCamelCase(key), boundAst,
    );
    return { descriptor, boundAst };
}
