/**
 * Declarative Resource -> Model semantic resolver.
 *
 * Resolution is a prioritized relation fold: controller evidence, propagated
 * knowledge, convention evidence, structural evidence, then an explicit DTO
 * terminal. Host-language absence is normalized into Presence/Lookup witnesses.
 */

import type { ResourceName } from "../../../../types/upstream/names";
import { astSemanticStageInterfaceOf, type AstSemanticStageInterface } from '../../../../types/upstream/astSemanticStageInterfaceAlgebra';
import type { ModelSymbolTable } from "../../symbols/ModelSymbolTable";
import {
    type ResourceModelBinding,
    ResourceModelBindingFactory,
    matchResourceModelBinding
} from "../../symbols/resource/resourceBindingTypes";
import { matchStructuralFields } from "./structuralFieldMatcher";
import { findControllerResourceBinding } from "../../subscanners/controller/resourceDataflowAggregator";
import { matchLookup, type Lookup } from "../../../../types/upstream/collections";
import { type Presence, presenceFold } from "../../../../types/upstream/presence";
import type { OriginModelSymbol } from "../../symbols/model/originModelSymbol";
import type { ResourceModelKnowledgeDataFlow } from "../../subscanners/resource/resourceModelKnowledgeDataFlow";
import { relationAll, relationEqual, relationGate } from "../../../../semantic/kernel/semanticRelations";
import { relationFirst, relationOptionFold, relationProject } from "../../../../semantic/kernel/relationalSequence";
import { astSemanticTextTerm } from "../../../../types/upstream/astSemanticInterface";
import { createResolverGraphPort, resolverGraphFact, type AstSemanticStagePort } from "../../../../types/upstream/astSemanticStageInterface";

export interface ResourceModelResolutionInput {
    readonly resourceName: ResourceName;
    readonly fieldNames: readonly string[];
    readonly modelSymbolTable: ModelSymbolTable;
    readonly controllerDataflowMap: Presence<import("../../subscanners/controller/resourceDataflowAggregator").ControllerResourceDataflow>;
    readonly knowledgeDataFlow: Presence<ResourceModelKnowledgeDataFlow>;
}


const bind = (
        lookup: Lookup<OriginModelSymbol>,
        source: Parameters<typeof ResourceModelBindingFactory.mono>[1]
    ): Presence<ResourceModelBinding> => {
        return matchLookup(lookup, {
            missing: () => ({ kind: 'absent' }),
            found: ({ value }) => ({ kind: 'present', value: ResourceModelBindingFactory.mono(value, source) })
        });
    };

const controllerCandidate = (input: ResourceModelResolutionInput): Presence<ResourceModelBinding> => {
        return presenceFold(
            input.controllerDataflowMap,
            () => ({ kind: 'absent' }),
            value => relationOptionFold(
                findControllerResourceBinding(value, input.resourceName),
                () => ({ kind: 'absent' }),
                binding => bind(
                    relationGate(
                        relationEqual(binding.model.kind, 'table'),
                        () => input.modelSymbolTable.findByTableName(binding.model.name),
                        () => input.modelSymbolTable.get(binding.model.name)
                    ),
                    'controller_dataflow'
                )
            )
        );
    };

const propagatedCandidate = (input: ResourceModelResolutionInput): Presence<ResourceModelBinding> => {
        return presenceFold(
            input.knowledgeDataFlow,
            () => ({ kind: 'absent' }),
            value => {
                const fact = relationFirst(
                    value.resolutions,
                    candidate => relationAll([
                        relationEqual(candidate.resource.value.value, input.resourceName.value.value),
                        relationEqual(candidate.origin, 'relation_propagation')
                    ])
                );
                return relationOptionFold(
                    fact,
                    () => ({ kind: 'absent' }),
                    candidate => bind(
                        input.modelSymbolTable.get(candidate.model),
                        'relation_propagation'
                    )
                );
            }
        );
    };

const conventionCandidate = (input: ResourceModelResolutionInput): Presence<ResourceModelBinding> => {
        return bind(
            input.modelSymbolTable.findForResource(input.resourceName),
            'convention'
        );
    };

const structuralCandidate = (input: ResourceModelResolutionInput): Presence<ResourceModelBinding> => {
        const candidate = relationOptionFold(
            relationFirst([input.fieldNames], fields => fields.length > 0),
            () => ({ kind: 'absent' }),
            fields => matchStructuralFields(fields, input.modelSymbolTable)
        );
        return presenceFold(
            candidate,
            () => ({ kind: 'absent' }),
            value => ({ kind: 'present', value: ResourceModelBindingFactory.mono(value, 'structural') })
        );
    };

/** Resolves the backing Eloquent Model through a declarative priority relation. */
const resolveResourceModel = (input: ResourceModelResolutionInput): ResourceModelBinding => {
        const candidates = [
            controllerCandidate(input),
            propagatedCandidate(input),
            conventionCandidate(input),
            structuralCandidate(input),
        ];

        const first = relationOptionFold(
            relationFirst(candidates, candidate => relationEqual(candidate.kind, 'present')),
            () => ResourceModelBindingFactory.unbackedDto(
                `Resource '${input.resourceName}' is a DTO without a matching Eloquent model.`
            ),
            candidate => candidate.value
        );
        return first;
}

export const resolveResourceModelPort = (input: ResourceModelResolutionInput): AstSemanticStagePort => {
        const binding = resolveResourceModel(input);
        return createResolverGraphPort(matchResourceModelBinding(binding, {
            mono: value => [resolverGraphFact('resolver_resolves', astSemanticTextTerm(input.resourceName.value.value), astSemanticTextTerm(value.model.identity.name.value))],
            poly: value => relationProject(value.models, model => resolverGraphFact('resolver_candidate', astSemanticTextTerm(input.resourceName.value.value), astSemanticTextTerm(model.identity.name.value))),
            unbacked_dto: () => [resolverGraphFact('resolver_conflict', astSemanticTextTerm(input.resourceName.value.value), astSemanticTextTerm('unbacked_dto'))],
        }));
};

export const ResourceModelResolver = Object.freeze({ resolve: resolveResourceModel, resolvePort: resolveResourceModelPort });


export const resolveResourceModelInterface = (...args: Parameters<typeof resolveResourceModelPort>): AstSemanticStageInterface =>
  astSemanticStageInterfaceOf(resolveResourceModelPort(...args));
