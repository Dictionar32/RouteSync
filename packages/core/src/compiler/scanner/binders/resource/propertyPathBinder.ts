/** Resolves chained PHP member access against verified model symbols. */
import type { OriginModelSymbol, ModelSymbolTable } from "../../symbols/ModelSymbolTable";
import { ResourceFieldExpressionFactory } from "../../../../types/route";
import { BoundSemanticFactory, type BoundStepEdge } from "../../../../types/domain/boundAst";
import { SemanticValueFactory } from "../../../../types/domain/semanticValues";
import { ScannedResourceFieldDescriptor } from "../../descriptors/resourceDescriptors";
import { ErrorType, NullableType, ReferenceType, ReadonlyCollectionType, CollectionKind, PrimitiveType, PrimitiveKind, type SemanticType } from "../../../types/SemanticType";
import { lookupEloquentMethod } from "../../../semantic/EloquentRegistry";
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
        if (member.kind === 'method_chain') {
            const rule = lookupEloquentMethod(member.property);
            if (!rule) return unresolved(key);
            const cardinality = methodCardinality(rule.returns);
            const stepType = methodSemanticType(rule.returns, model.name);
            steps.push({
                kind: 'method',
                sourceModel: SemanticValueFactory.modelName(model.name),
                method: SemanticValueFactory.methodName(member.property),
                cardinality,
                nullsafe: member.access.kind === 'nullsafe',
                stepType,
                targetModel: { kind: 'model', name: SemanticValueFactory.modelName(model.name) },
            });
            resultingType = member.access.kind === 'nullsafe' && !stepType.isNullable()
                ? new NullableType(stepType)
                : stepType;
            if (rule.returns.kind === 'model') {
                if (member !== members[members.length - 1]) continue;
                finalRelation = false;
                continue;
            }
            if (rule.returns.kind === 'builder') continue;
            return unresolved(key);
        }
        const binding = model.resolveProperty(member.property);
        if (!binding) return unresolved(key);
        const stepType = member.access.kind === 'nullsafe' && !binding.semanticType.isNullable()
            ? new NullableType(binding.semanticType)
            : binding.semanticType;
        steps.push({
            kind: 'property',
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

function methodCardinality(returns: import("../../../semantic/EloquentRegistry").EloquentReturn): import("../../../../types/domain/boundAst").BoundCardinality {
    if (returns.kind !== 'model') return { kind: 'single' };
    if (returns.cardinality.kind === 'single') return { kind: 'single' };
    if (returns.cardinality.kind === 'paginated_collection') return { kind: 'paginated_collection' };
    return { kind: 'collection' };
}

function methodSemanticType(returns: import("../../../semantic/EloquentRegistry").EloquentReturn, model: string): SemanticType {
    if (returns.kind === 'model') {
        if (returns.cardinality.kind === 'single') return new ReferenceType('', model);
        return new ReadonlyCollectionType(CollectionKind.ARRAY, new ReferenceType('', model));
    }
    if (returns.kind === 'number') return new PrimitiveType(PrimitiveKind.NUMBER);
    if (returns.kind === 'boolean') return new PrimitiveType(PrimitiveKind.BOOLEAN);
    return new ReferenceType('', model);
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
