import type { OriginModelSymbol, ModelSymbolTable } from "../../symbols/ModelSymbolTable";
import { SemanticValueFactory } from "../../../../types/domain/semanticValues";
import { NullableType, type SemanticType } from "../../../types/SemanticType";
import { resolveResourceMethodInvocation, type ResourceQueryState } from "../../../types/domain/resourceModelMethodSurface";
import type { ResourcePropertyPathResult, ResourcePropertyPathStep } from "../../../../types/domain/resourcePropertyPathModel";
import type { PhpAstValue } from "../../lexer/PhpAst";

type Member = Extract<PhpAstValue, { kind: 'property_access' | 'method_chain' }>;

export function resolvePropertyPath(
    value: Member,
    rootModel: OriginModelSymbol,
    table: ModelSymbolTable
): ResourcePropertyPathResult {
    const members = collectMembers(value);
    let model = rootModel;
    let state: ResourceQueryState = { kind: 'model_instance', model: model.node.semantic };
    const steps: ResourcePropertyPathStep[] = [];
    let resultingType: SemanticType | undefined;

    for (const member of members) {
        if (member.kind === 'method_chain') {
            const invocation = resolveResourceMethodInvocation(state, SemanticValueFactory.methodName(member.property), member.arguments.map(argument => argument.value));
            if (invocation.result.kind === 'unsupported') return { kind: 'rejected', reason: 'missing_property' };
            const type = invocation.result.semanticType;
            steps.push({
                kind: 'method',
                sourceModel: model.node.semantic,
                method: SemanticValueFactory.methodName(member.property),
                access: member.access,
                result: invocation.result,
                type,
                cardinality: invocation.result.cardinality
            });
            resultingType = type;
            if (invocation.result.kind === 'query_builder') {
                state = invocation.result;
                continue;
            }
            if (invocation.result.kind === 'single_model' || invocation.result.kind === 'model_collection' || invocation.result.kind === 'paginated_collection') {
                const next = table.get(invocation.result.model.identity.name.value);
                if (next === undefined && member !== members[members.length - 1]) return { kind: 'rejected', reason: 'missing_target_model' };
                if (next !== undefined) model = next;
                state = { kind: 'model_instance', model: invocation.result.model };
                continue;
            }
            if (member !== members[members.length - 1]) return { kind: 'rejected', reason: 'non_terminal_scalar' };
            continue;
        }

        const binding = model.resolveProperty(member.property);
        if (resolvedBinding.kind === 'missing') return { kind: 'rejected', reason: 'missing_property' };
        const resolvedBinding = binding.value;
        const type = member.access.kind === 'nullsafe' && !resolvedBinding.semanticType.isNullable()
            ? new NullableType(resolvedBinding.semanticType)
            : resolvedBinding.semanticType;
        if (resolvedBinding.kind === 'relation') {
            const target = table.get(resolvedBinding.source.targetModel.value);
            if (target === undefined) return { kind: 'rejected', reason: 'missing_target_model' };
            steps.push({
                kind: 'relation',
                sourceModel: model.node.semantic,
                property: resolvedBinding.source.property,
                access: member.access,
                semantic: resolvedBinding.source,
                type,
                targetModel: target.node.semantic,
                cardinality: relationCardinality(resolvedBinding.source.cardinality)
            });
            resultingType = type;
            model = target;
            state = { kind: 'model_instance', model: target.node.semantic };
            continue;
        }
        if (member !== members[members.length - 1]) return { kind: 'rejected', reason: 'non_terminal_scalar' };
        steps.push({
            kind: 'property',
            sourceModel: model.node.semantic,
            property: resolvedBinding.source.property,
            access: member.access,
            semantic: resolvedBinding.source,
            type,
            cardinality: { kind: 'single' }
        });
        resultingType = type;
    }

    if (resultingType === undefined) return { kind: 'rejected', reason: 'missing_property' };
    return { kind: 'resolved', rootModel: rootModel.node.semantic, steps: Object.freeze(steps), type: resultingType };
}


import { toBoundStep, expressionForType, unresolved } from './propertyPathBindingSupport';
