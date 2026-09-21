import { ResourceFieldExpressionFactory } from "../../../../types/route";
import { BoundSemanticFactory, type BoundStepEdge } from "../../../../types/domain/boundAst";
import type { SemanticType } from "../../../types/SemanticType";
import { ErrorType } from "../../../types/SemanticType";
import type { ResourcePropertyPathStep } from "../../../../types/domain/resourcePropertyPathModel";
import { ScannedResourceFieldDescriptor } from "../../descriptors/resourceDescriptors";
import { matchPhpAccessMode } from "../../lexer/phpAstAlgebra";
import type { BoundResourceFieldResult } from "../SemanticResourceBinder";
import type { PhpAstValue } from "../../lexer/PhpAst";

type Member = Extract<PhpAstValue, { kind: 'property_access' | 'method_chain' }>;

export function toBoundStep(step: ResourcePropertyPathStep): BoundStepEdge {
    if (step.kind === 'relation') {
        return {
            kind: 'property',
            sourceModel: step.sourceModel.identity.name,
            property: step.property,
            step: { kind: 'relation', cardinality: step.cardinality },
            nullsafe: matchPhpAccessMode(step.access, { direct: () => false, nullsafe: () => true }),
            stepType: step.type,
            targetModel: { kind: 'model', name: step.targetModel.identity.name }
        };
    }
    if (step.kind === 'property') {
        return {
            kind: 'property',
            sourceModel: step.sourceModel.identity.name,
            property: step.property,
            step: { kind: step.semantic.kind },
            nullsafe: matchPhpAccessMode(step.access, { direct: () => false, nullsafe: () => true }),
            stepType: step.type,
            targetModel: { kind: 'model', name: step.sourceModel.identity.name }
        };
    }
    return {
        kind: 'method',
        sourceModel: step.sourceModel.identity.name,
        method: step.method,
        cardinality: step.cardinality,
        nullsafe: matchPhpAccessMode(step.access, { direct: () => false, nullsafe: () => true }),
        stepType: step.type,
        targetModel: step.result.kind === 'single_model' || step.result.kind === 'model_collection' || step.result.kind === 'paginated_collection'
            ? { kind: 'model', name: step.result.model.identity.name }
            : { kind: 'model', name: step.sourceModel.identity.name }
    };
}

export function relationCardinality(cardinality: import("../../../../types/domain/eloquentTypes").EloquentRelationCardinality): import("../../../../types/domain/boundAst").BoundCardinality {
    switch (cardinality) {
        case 'one': return { kind: 'single' };
        case 'many': return { kind: 'collection' };
    }
}

export function collectMembers(value: Member): readonly Member[] {
    if (value.receiver.kind === 'property_access' || value.receiver.kind === 'method_chain') {
        return [...collectMembers(value.receiver), value];
    }
    return [value];
}

export function expressionForType(type: SemanticType) {
    return type.kind === 'primitive'
        ? ResourceFieldExpressionFactory.primitive(type.type)
        : ResourceFieldExpressionFactory.unsupported('invalid_boundary_input');
}

export function unresolved(key: string, reason: 'missing_property' | 'non_terminal_scalar' | 'missing_target_model'): BoundResourceFieldResult {
    const boundAst = BoundSemanticFactory.unsupported(reason === 'missing_property' ? 'unresolved_property' : 'unresolved_property');
    return {
        descriptor: ScannedResourceFieldDescriptor.fromExpression(
            key,
            ResourceFieldExpressionFactory.unsupported('unresolved_property'),
            new ErrorType('Property path could not be resolved'),
            undefined,
            boundAst
        ),
        boundAst
    };
}
