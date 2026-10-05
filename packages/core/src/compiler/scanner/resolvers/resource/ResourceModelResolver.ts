/**
 * Declarative Resource -> Model semantic resolver.
 *
 * Resolution is a prioritized relation fold: controller evidence, propagated
 * knowledge, convention evidence, structural evidence, then an explicit DTO
 * terminal. Host-language absence is normalized into Presence/Lookup witnesses.
 */

import type { PropertyName, ResourceName } from "../../../../types/upstream/names";
import { astSemanticStageInterfaceOf, type AstSemanticStageInterface } from '../../../../types/upstream/astSemanticStageInterfaceAlgebra';
import type { ModelSymbolTable } from "../../symbols/ModelSymbolTable";
import {
    type ResourceModelBinding,
    ResourceModelBindingFactory,
    ResourceModelBindingSource,
    matchResourceModelBinding
} from "../../symbols/resource/resourceBindingTypes";
import { matchStructuralFields } from "./structuralFieldMatcher";
import { findControllerResourceBinding } from "../../subscanners/controller/resourceDataflowAggregator";
import { matchLookup, type Lookup } from "../../../../types/upstream/collections";
import { absent, present, type Presence, presenceFold } from "../../../../types/upstream/presence";
import type { OriginModelSymbol } from "../../symbols/model/originModelSymbol";
import { stringValue } from "../../../../types/upstream/valueObjects";
import type { ResourceModelKnowledgeDataFlow } from "../../subscanners/resource/resourceModelKnowledgeDataFlow";
import { relationAll, relationEqual } from "../../../../semantic/foundation/semanticRelations";
import { relationFirst, relationOptionFold, relationProject } from "../../../../semantic/foundation/relationalSequence";
import { astSemanticTextTerm } from "../../../../types/upstream/astSemanticInterface";
import { createResolverGraphPort, resolverGraphFact, type AstSemanticStagePort } from "../../../../types/upstream/astSemanticStageInterface";

export interface ResourceModelResolutionInput {
    readonly resourceName: ResourceName;
    readonly fieldNames: readonly PropertyName[];
    readonly modelSymbolTable: ModelSymbolTable;
    readonly controllerDataflowMap: Presence<import("../../subscanners/controller/resourceDataflowAggregator").ControllerResourceDataflow>;
    readonly knowledgeDataFlow: Presence<ResourceModelKnowledgeDataFlow>;
}


const bind = (
        lookup: Lookup<OriginModelSymbol>,
        source: Parameters<typeof ResourceModelBindingFactory.mono>[1]
    ): Presence<ResourceModelBinding> => {
        return matchLookup(lookup, {
            missing: () => absent<ResourceModelBinding>(),
            found: ({ value }) => present(ResourceModelBindingFactory.mono(value, source))
        });
    };

const controllerCandidate = (input: ResourceModelResolutionInput): Presence<ResourceModelBinding> => {
        return presenceFold(
            input.controllerDataflowMap,
            () => absent<ResourceModelBinding>(),
            value => relationOptionFold(
                findControllerResourceBinding(value, input.resourceName),
                () => absent<ResourceModelBinding>(),
                binding => bind(
                    input.modelSymbolTable.findForControllerOrigin(binding.model),
                    ResourceModelBindingSource.controllerDataflow,
                )
            )
        );
    };

const propagatedCandidate = (input: ResourceModelResolutionInput): Presence<ResourceModelBinding> => {
        return presenceFold(
            input.knowledgeDataFlow,
            () => absent<ResourceModelBinding>(),
            value => {
                const fact = relationFirst(
                    value.resolutions,
                    candidate => relationAll([
                        relationEqual(candidate.resource.value.value, input.resourceName.value.value),
                        relationEqual(candidate.origin.kind, 'relation_propagation')
                    ])
                );
                return relationOptionFold(
                    fact,
                    () => absent<ResourceModelBinding>(),
                    candidate => bind(
                        input.modelSymbolTable.get(candidate.model),
                        ResourceModelBindingSource.relationPropagation
                    )
                );
            }
        );
    };

const conventionCandidate = (input: ResourceModelResolutionInput): Presence<ResourceModelBinding> => {
        return bind(
            input.modelSymbolTable.findForResource(input.resourceName),
            ResourceModelBindingSource.convention
        );
    };

const structuralCandidate = (input: ResourceModelResolutionInput): Presence<ResourceModelBinding> =>
    relationOptionFold(
        relationFirst([input.fieldNames], fields => fields.length > 0),
        () => absent<ResourceModelBinding>(),
        fields => presenceFold(
            matchStructuralFields(fields, input.modelSymbolTable),
            () => absent<ResourceModelBinding>(),
            value => present(ResourceModelBindingFactory.mono(value, ResourceModelBindingSource.structural)),
        ),
    );

/** Resolves the backing Eloquent Model through a declarative priority relation. */
const resolveResourceModel = (input: ResourceModelResolutionInput): ResourceModelBinding => {
        const candidates: readonly Presence<ResourceModelBinding>[] = Object.freeze([
            controllerCandidate(input),
            propagatedCandidate(input),
            conventionCandidate(input),
            structuralCandidate(input),
        ]);

        const first = relationOptionFold(
            relationFirst(candidates, candidate => relationEqual(candidate.kind, 'present')),
            () => ResourceModelBindingFactory.unbackedDto(
                stringValue(`Resource '${input.resourceName.value.value}' is a DTO without a matching Eloquent model.`)
            ),
            candidate => presenceFold(candidate,
                () => ResourceModelBindingFactory.unbackedDto(
                    stringValue(`Resource '${input.resourceName.value.value}' is a DTO without a matching Eloquent model.`)
                ),
                value => value,
            )
        );
        return first;
}

export const resolveResourceModelPort = (input: ResourceModelResolutionInput): AstSemanticStagePort => {
        const binding = resolveResourceModel(input);
        return createResolverGraphPort(matchResourceModelBinding(binding, {
            mono: value => [resolverGraphFact('resolver_resolves', astSemanticTextTerm(input.resourceName.value.value), astSemanticTextTerm(value.model.name.value.value))],
            poly: value => relationProject(value.models, model => resolverGraphFact('resolver_candidate', astSemanticTextTerm(input.resourceName.value.value), astSemanticTextTerm(model.name.value.value))),
            unbacked_dto: () => [resolverGraphFact('resolver_conflict', astSemanticTextTerm(input.resourceName.value.value), astSemanticTextTerm('unbacked_dto'))],
        }));
};

export const ResourceModelResolver = Object.freeze({ resolve: resolveResourceModel, resolvePort: resolveResourceModelPort });


export const resolveResourceModelInterface = (...args: Parameters<typeof resolveResourceModelPort>): AstSemanticStageInterface =>
  astSemanticStageInterfaceOf(resolveResourceModelPort(...args));
