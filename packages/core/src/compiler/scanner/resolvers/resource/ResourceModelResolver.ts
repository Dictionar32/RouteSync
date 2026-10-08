/**
 * Compiler-to-upstream wiring adapter for Resource -> Model reasoning.
 *
 * This module assembles compiler evidence and materializes the upstream
 * ResourceModelJudgment into the compiler's ResourceModelBinding. Semantic
 * precedence itself belongs to types/upstream/resourceModelReasoning.ts.
 */
import type { PropertyName, ResourceName } from "../../../../types/upstream/names";
import type { ModelSymbolTable } from "../../symbols/ModelSymbolTable";
import {
    type ResourceModelBinding,
    ResourceModelBindingFactory,
    ResourceModelBindingSource,
} from "../../symbols/resource/resourceBindingTypes";
import { matchStructuralFields } from "./structuralFieldMatcher";
import { findControllerResourceBinding, type ControllerResourceDataflow } from "../../subscanners/controller/resourceDataflowAggregator";
import { matchLookup, type Lookup, type Option } from "../../../../types/upstream/collections";
import type { OriginModelSymbol } from "../../symbols/model/originModelSymbol";
import type { ResourceModelKnowledgeDataFlow } from "../../subscanners/resource/resourceModelKnowledgeDataFlow";
import { absent, present, type Presence, presenceFold } from "../../../../types/upstream/presence";
import { relationEqual } from "../../../../semantic/foundation/semanticRelations";
import { relationFirst, relationOptionFold } from "../../../../semantic/foundation/relationalSequence";
import { astSemanticTextTerm } from "../../../../types/upstream/astSemanticInterface";
import { stringValue } from "../../../../types/upstream/valueObjects";
import { matchResourceModelBinding } from "../../symbols/resource/resourceBindingTypes";
import { createResolverGraphPort, resolverGraphFact, type AstSemanticStagePort } from "../../../../types/upstream/astSemanticStageInterface";
import {
    reasonResourceModel,
    type ResourceModelCandidate,
    type ResourceModelCandidateSource,
    type ResourceModelReasoningInput,
} from "../../../../types/upstream/resourceModelReasoning";

export interface ResourceModelResolutionInput {
    readonly resourceName: ResourceName;
    readonly fieldNames: readonly PropertyName[];
    readonly modelSymbolTable: ModelSymbolTable;
    readonly controllerDataflowMap: Presence<ControllerResourceDataflow>;
    readonly knowledgeDataFlow: Presence<ResourceModelKnowledgeDataFlow>;
}

const bindingSourceByReasoningSource = (source: ResourceModelCandidateSource): ResourceModelBindingSource => {
    const sources: Readonly<Record<ResourceModelCandidateSource, ResourceModelBindingSource>> = Object.freeze({
        controller_dataflow: ResourceModelBindingSource.controllerDataflow,
        relation_propagation: ResourceModelBindingSource.relationPropagation,
        convention: ResourceModelBindingSource.convention,
        structural: ResourceModelBindingSource.structural,
    });
    return sources[source];
};

const candidateFromLookup = (
    resourceName: ResourceName,
    source: ResourceModelCandidateSource,
    lookup: Lookup<OriginModelSymbol>,
): Presence<ResourceModelCandidate> => matchLookup(lookup, {
    missing: () => absent<ResourceModelCandidate>(),
    found: ({ value }) => present({ resource: resourceName, model: value.name, source }),
});

const compilerCandidates = (input: ResourceModelResolutionInput): readonly ResourceModelCandidate[] => {
    const controller = presenceFold(
        input.controllerDataflowMap,
        () => [] as readonly ResourceModelCandidate[],
        dataflow => relationOptionFold(
            findControllerResourceBinding(dataflow, input.resourceName),
            () => [] as readonly ResourceModelCandidate[],
            binding => presenceFold(
                candidateFromLookup(input.resourceName, 'controller_dataflow', input.modelSymbolTable.findForControllerOrigin(binding.model)),
                () => [],
                candidate => [candidate],
            ),
        ),
    );

    const propagated = presenceFold(
        input.knowledgeDataFlow,
        () => [] as readonly ResourceModelCandidate[],
        dataflow => relationOptionFold(
            relationFirst(
                dataflow.resolutions,
                candidate => relationEqual(candidate.resource.value.value, input.resourceName.value.value)
                    && relationEqual(candidate.origin.kind, 'relation_propagation'),
            ),
            () => [] as readonly ResourceModelCandidate[],
            candidate => [
                { resource: input.resourceName, model: candidate.model, source: 'relation_propagation' as const },
            ],
        ),
    );

    const convention = presenceFold(
        candidateFromLookup(input.resourceName, 'convention', input.modelSymbolTable.findForResource(input.resourceName)),
        () => [],
        candidate => [candidate],
    );

    const structural = relationOptionFold(
        relationFirst([input.fieldNames], fields => fields.length > 0),
        () => [] as readonly ResourceModelCandidate[],
        fields => presenceFold(
            matchStructuralFields(fields, input.modelSymbolTable),
            () => [],
            value => [{ resource: input.resourceName, model: value.name, source: 'structural' as const }],
        ),
    );

    return Object.freeze([...controller, ...propagated, ...convention, ...structural]);
};

const resolveResourceModel = (input: ResourceModelResolutionInput): ResourceModelBinding => {
    const reasoningInput: ResourceModelReasoningInput = Object.freeze({
        resource: input.resourceName,
        candidates: compilerCandidates(input),
    });
    const judgment = reasonResourceModel(reasoningInput);

    return presenceFold(
        judgment.model,
        () => ResourceModelBindingFactory.unbackedDto(
            stringValue(`Resource '${input.resourceName.value.value}' is a DTO without a matching Eloquent model.`),
        ),
        model => presenceFold(
            judgment.source,
            () => ResourceModelBindingFactory.unbackedDto(
                stringValue(`Resource '${input.resourceName.value.value}' has no semantic binding source.`),
            ),
            source => matchLookup(input.modelSymbolTable.get(model), {
                missing: () => ResourceModelBindingFactory.unbackedDto(
                    stringValue(`Resource '${input.resourceName.value.value}' resolved to an unavailable model.`),
                ),
                found: ({ value }) => ResourceModelBindingFactory.mono(value, bindingSourceByReasoningSource(source)),
            }),
        ),
    );
};
export const resolveResourceModelPort = (input: ResourceModelResolutionInput): AstSemanticStagePort => {
    const binding = resolveResourceModel(input);
    return createResolverGraphPort(matchResourceModelBinding(binding, {
        mono: value => [resolverGraphFact(
            'resolver_resolves',
            astSemanticTextTerm(input.resourceName.value.value),
            astSemanticTextTerm(value.model.name.value.value),
        )],
        poly: value => value.models.map(model => resolverGraphFact(
            'resolver_candidate',
            astSemanticTextTerm(input.resourceName.value.value),
            astSemanticTextTerm(model.name.value.value),
        )),
        unbacked_dto: () => [resolverGraphFact(
            'resolver_conflict',
            astSemanticTextTerm(input.resourceName.value.value),
            astSemanticTextTerm('unbacked_dto'),
        )],
    }));
};
export const ResourceModelResolver = Object.freeze({ resolve: resolveResourceModel, resolvePort: resolveResourceModelPort });
export const resolveResourceModelInterface = (...args: Parameters<typeof resolveResourceModelPort>) => resolveResourceModelPort(...args);
