/** Resolves chained PHP member access against verified model symbols. */
import type { OriginModelSymbol, ModelSymbolTable } from "../../symbols/ModelSymbolTable";
import { ResourceFieldExpressionFactory } from "../../../../types/route";
import { BoundSemanticFactory, type BoundStepEdge } from "../../../../types/domain/boundAst";
import { SemanticValueFactory } from "../../../../types/domain/semanticValues";
import { ScannedResourceFieldDescriptor } from "../../descriptors/resourceDescriptors";
import { ErrorType, NullableType, type SemanticType } from "../../../types/SemanticType";
import type { PhpAstValue } from "../../lexer/PhpAst";
import type { BoundResourceFieldResult } from "../SemanticResourceBinder";

type Member = Extract<PhpAstValue, { kind: 'property_access' | 'method_chain' }>;

export function bindPropertyPathField(
    key: string,
    value: Member,
    rootModel: OriginModelSymbol,
    table: ModelSymbolTable
): BoundResourceFieldResult {
    const members = collectMembers(value);
    let model = rootModel;
    let resultingType: SemanticType = new ErrorType('Property path could not be resolved');
    let finalRelation = false;
    const steps: BoundStepEdge[] = [];

    for (const member of members) {
        if (member.kind === 'method_chain') return unresolved(key);
        const binding = model.resolveProperty(member.property);
        if (!binding) return unresolved(key);
        const stepType = member.access.kind === 'nullsafe' && !binding.semanticType.isNullable()
            ? new NullableType(binding.semanticType)
            : binding.semanticType;
        steps.push({
            sourceModel: SemanticValueFactory.modelName(model.name),
            property: SemanticValueFactory.propertyName(member.property),
            step: binding.kind === 'relation'
                ? { kind: 'relation', cardinality: binding.source.cardinality === 'many' ? { kind: 'collection' } : { kind: 'single' } }
                : { kind: binding.kind },
            nullsafe: member.access.kind === 'nullsafe',
            stepType,
            targetModel: { kind: 'model', name: SemanticValueFactory.modelName(binding.kind === 'relation' ? binding.source.targetModel.value : model.name) }
        });
        resultingType = stepType;
        finalRelation = binding.kind === 'relation';
        if (binding.kind !== 'relation') {
            if (member !== members[members.length - 1]) return unresolved(key);
            continue;
        }
        if (binding.source.cardinality === 'many' && member !== members[members.length - 1]) return unresolved(key);
        const next = table.get(binding.source.targetModel.value);
        if (!next && member !== members[members.length - 1]) return unresolved(key);
        if (next) model = next;
    }

    const boundAst = BoundSemanticFactory.propertyChain({
        rootModel: SemanticValueFactory.modelName(rootModel.name),
        steps,
        resultingType,
        nullability: resultingType.isNullable() ? { kind: 'nullable' } : { kind: 'non_nullable' }
    });
    const expression = finalRelation
        ? ResourceFieldExpressionFactory.resource(SemanticValueFactory.resourceName(model.name))
        : expressionForType(resultingType);
    const descriptor = ScannedResourceFieldDescriptor.fromExpression(
        key,
        expression,
        resultingType,
        undefined,
        boundAst
    );
    return { descriptor, boundAst };
}

function collectMembers(value: Member): readonly Member[] {
    if (value.receiver.kind === 'property_access' || value.receiver.kind === 'method_chain') {
        return [...collectMembers(value.receiver), value];
    }
    return [value];
}

function expressionForType(type: SemanticType) {
    return type.kind === 'primitive'
        ? ResourceFieldExpressionFactory.primitive(type.type)
        : ResourceFieldExpressionFactory.unsupported('invalid_boundary_input');
}

function unresolved(key: string): BoundResourceFieldResult {
    const boundAst = BoundSemanticFactory.unsupported('unresolved_property');
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
